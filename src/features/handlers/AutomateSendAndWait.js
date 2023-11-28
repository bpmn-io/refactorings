import { getMid } from 'diagram-js/lib/layout/LayoutUtil';

/**
 * This module provides the handler for the automate-send-and-wait refactoring.
 *
 * @implements {import("./Handler").default}
 */
export default class AutomateSendAndWait {
  constructor(
      bpmnFactory,
      commandStackPreview,
      elementFactory,
      elementRegistry,
      elementTemplates,
      modeling,
      spaceTool
  ) {
    this._bpmnFactory = bpmnFactory;
    this._commandStackPreview = commandStackPreview;
    this._elementFactory = elementFactory;
    this._elementRegistry = elementRegistry;
    this._elementTemplates = elementTemplates;
    this._modeling = modeling;
    this._spaceTool = spaceTool;
  }

  getFunctionDescription() {
    return {
      'name': 'automate-send-and-wait',
      'parameters': {
        'type': 'object',
        'properties': {
          'sendTaskName': {
            'type': 'string',
            'description': 'The name of the send task'
          },
          'intermediateCatchEventName': {
            'type': 'string',
            'description': 'The name of the intermediate catch event name'
          }
        },
        'required': [
          'sendTaskName',
          'intermediateCatchEventName'
        ]
      },
      'description': `Can perform the following refactoring action: A task with
the name that indicates sending a message and then waiting for an answer can be
replaced by a send task that sends the message and an intermediate catch event
that waits for an answer.`.split('\n').map(line => line.trim()).join(' '),
    };
  }

  preview(element, refactoring) {
    this._commandStackPreview.enable();

    const {
      sendTaskName,
      intermediateCatchEventName
    } = refactoring;

    // (1) create space
    const elementMid = getMid(element);

    const elements = this._elementRegistry.getAll();

    const delta = 100;

    const adjustments = this._spaceTool.calculateAdjustments(elements, 'x', delta, elementMid.x);

    const direction = 'e',
          start = elementMid.x;

    this._modeling.createSpace(adjustments.movingShapes, adjustments.resizingShapes, {
      x: delta,
      y: 0
    }, direction, start);

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

    this._modeling.createShape(intermediateCatchEvent, {
      x: element.x + element.width + 80,
      y: element.y + element.height / 2
    }, element.parent);

    // (3) reconnect outgoing sequence flows from original shape to intermediate catch event
    element.outgoing.forEach(outgoing => {
      this._modeling.reconnectStart(outgoing, intermediateCatchEvent, {
        x: element.x + element.width + 80,
        y: element.y + element.height / 2
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

    this._modeling.replaceShape(element, sendTask);

    // (5) connect send task to intermediate catch event
    this._modeling.connect(sendTask, intermediateCatchEvent);

    return {
      cancel: () => this._commandStackPreview.disable(),
      ok: () => this._commandStackPreview.disable(false),
      elements: this._commandStackPreview.getElementsChanged()
    };
  }

  validate(element, refactoring) {
    return refactoring.name === 'automate-send-and-wait'
      && refactoring.arguments.sendTaskName
      && refactoring.arguments.intermediateCatchEventName;
  }

  static priority = 1000;
}

AutomateSendAndWait.$inject = [
  'bpmnFactory',
  'commandStackPreview',
  'elementFactory',
  'elementRegistry',
  'elementTemplates',
  'modeling',
  'spaceTool'
];