import {
  getMid,
  asTRBL,
  getOrientation
} from 'diagram-js/lib/layout/LayoutUtil';

import { getExternalLabelMid, DEFAULT_LABEL_SIZE } from 'bpmn-js/lib/util/LabelUtil';

/**
 * This module provides the handler for the automate-send-and-wait refactoring.
 *
 * @implements {import("./Handler").default}
 */
export default class AutomateSendAndWait {
  constructor(bpmnFactory, complexPreview, elementFactory, moddleCopy, elementTemplates, textRenderer, spaceTool, canvas, elementRegistry, bpmnReplace, commandStack) {
    this._bpmnFactory = bpmnFactory;
    this._complexPreview = complexPreview;
    this._elementFactory = elementFactory;
    this._moddleCopy = moddleCopy;
    this._elementTemplates = elementTemplates;
    this._textRenderer = textRenderer;
    this._spaceTool = spaceTool;
    this._canvas = canvas;
    this._elementRegistry = elementRegistry;
    this._bpmnReplace = bpmnReplace;
    this._commandStack = commandStack;
  }

  getMetaData() {
    return {
      id: 'automate-send-and-wait',
      description: 'A user task "Send a message and wait for a response" can be automated by replacing it with a send task and an intermediate catch event. Example input: User Task "Send a message and wait for a response" Example Output: { "id": "automate-send-and-wait", "sendTaskName": "Send a message", "intermediateCatchEventName": "Wait for response" }',
    };
  }

  refactor(element, refactoring) {
    const {
      sendTaskName,
      intermediateCatchEventName
    } = refactoring;

    const commands = [];

    // (1) create space
    const elementMid = getMid(element);

    const elements = this._elementRegistry.getAll();

    const delta = 100;

    const adjustments = this._spaceTool.calculateAdjustments(elements, 'x', delta, elementMid.x);

    commands.push({
      command: 'spaceTool',
      context: {
        movingShapes: adjustments.movingShapes,
        resizingShapes: adjustments.resizingShapes,
        delta: {
          x: delta,
          y: 0
        },
        direction: 'e',
        start: elementMid.x
      }
    });

    // (2) create intermediate catch event
    const eventDefinition = this._bpmnFactory.create('bpmn:MessageEventDefinition');

    const intermediateCatchEventBusinessObject = this._bpmnFactory.create('bpmn:IntermediateCatchEvent', {
      name: intermediateCatchEventName,
      eventDefinitions: [ eventDefinition ]
    });

    eventDefinition.$parent = intermediateCatchEventBusinessObject;

    const intermediateCatchEvent = this._elementFactory.createShape({
      type: 'bpmn:IntermediateCatchEvent',
      businessObject: intermediateCatchEventBusinessObject,
    });

    commands.push({
      command: 'shape.create',
      context: {
        shape: intermediateCatchEvent,
        position: {
          x: element.x + element.width + 80,
          y: element.y + element.height / 2
        },
        parent: element.parent,
        hints: {}
      }
    });

    // (3) reconnect outgoing sequence flows from original shape to intermediate catch event
    element.outgoing.forEach(outgoing => {
      commands.push({
        command: 'connection.reconnect',
        context: {
          connection: outgoing,
          newSource: intermediateCatchEvent,
          dockingOrPoints: {
            x: element.x + element.width + 80,
            y: element.y + element.height / 2
          },
          hints: {}
        }
      });
    });

    // (4) replace original shape with send task
    const sendTaskBusinessObject = this._bpmnFactory.create('bpmn:SendTask', {
      name: sendTaskName
    });

    const sendTask = this._elementFactory.createShape({
      type: 'bpmn:SendTask',
      businessObject: sendTaskBusinessObject,
      x: element.x + element.width / 2,
      y: element.y + element.height / 2
    });

    commands.push({
      command: 'shape.replace',
      context: {
        oldShape: element,
        newData: sendTask
      }
    });

    // (5) connect send task to intermediate catch event
    const sequenceFlow = this._elementFactory.createConnection({
      type: 'bpmn:SequenceFlow',
      source: sendTask,
      target: intermediateCatchEvent,
      waypoints: [
        {
          x: element.x + element.width / 2,
          y: element.y + element.height / 2
        },
        {
          x: element.x + element.width + 80,
          y: element.y + element.height / 2
        }
      ]
    });

    commands.push({
      command: 'connection.create',
      context: {
        connection: sequenceFlow,
        parent: element.parent,
        source: sendTask,
        target: intermediateCatchEvent,
        hints: {}
      }
    });

    this._commandStack.execute('refactorings.multiCommand', commands);
  }

  preview(element, refactoring) {
    const {
      sendTaskName,
      intermediateCatchEventName
    } = refactoring;

    const sendTaskBusinessObject = this._bpmnFactory.create('bpmn:SendTask', {
      name: sendTaskName
    });

    const sendTask = this._elementFactory.createShape({
      type: 'bpmn:SendTask',
      businessObject: sendTaskBusinessObject,
      x: element.x,
      y: element.y
    });

    const intermediateCatchEventBusinessObject = this._bpmnFactory.create('bpmn:IntermediateCatchEvent', {
      name: intermediateCatchEventName,
      eventDefinitions: [ this._bpmnFactory.create('bpmn:MessageEventDefinition') ]
    });

    const intermediateCatchEvent = this._elementFactory.createShape({
      type: 'bpmn:IntermediateCatchEvent',
      businessObject: intermediateCatchEventBusinessObject,
      x: element.x + sendTask.width + 80 - 18,
      y: element.y + element.height / 2 - 18
    });

    const mid = getExternalLabelMid(intermediateCatchEvent);

    const labelBounds = this._textRenderer.getExternalLabelBounds({
      ...DEFAULT_LABEL_SIZE,
      ...mid
    }, intermediateCatchEventName);

    const intermediateCatchEventLabel = this._elementFactory.createLabel({
      type: 'label',
      businessObject: intermediateCatchEventBusinessObject,
      labelTarget: intermediateCatchEvent,
      ...labelBounds
    });

    const sequenceFlow = this._elementFactory.createConnection({
      type: 'bpmn:SequenceFlow',
      source: sendTask,
      target: intermediateCatchEvent,
      waypoints: [
        {
          x: sendTask.x + sendTask.width,
          y: sendTask.y + sendTask.height / 2
        },
        {
          x: intermediateCatchEvent.x,
          y: intermediateCatchEvent.y + intermediateCatchEvent.height / 2
        }
      ]
    });

    const elementMid = getMid(element);

    const elements = this._elementRegistry.getAll();

    const delta = 100;

    const adjustments = this._spaceTool.calculateAdjustments(elements, 'x', delta, elementMid.x);

    this._complexPreview.create({
      removed: [
        element,
        ...element.outgoing
      ],
      created: [
        sendTask,
        intermediateCatchEvent,
        intermediateCatchEventLabel,
        sequenceFlow
      ],
      moved: [
        ...adjustments.movingShapes.map(movingShape => {
          return {
            element: movingShape,
            delta: {
              x: delta,
              y: 0
            }
          };
        })
      ]
    });

    return () => this._complexPreview.cleanUp();
  }

  static priority = 1000;
}

AutomateSendAndWait.$inject = [
  'bpmnFactory',
  'complexPreview',
  'elementFactory',
  'moddleCopy',
  'elementTemplates',
  'textRenderer',
  'spaceTool',
  'canvas',
  'elementRegistry',
  'bpmnReplace',
  'commandStack'
];