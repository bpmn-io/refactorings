import { getMid } from 'diagram-js/lib/layout/LayoutUtil';

/**
 * This module provides the handler for the replace-with-element-of-type refactoring.
 *
 * @implements {import("./Handler").default}
 */
export default class ReplaceWithElementOfType {
  constructor(
      bpmnFactory,
      bpmnReplace,
      commandStackPreview,
      elementFactory,
      elementRegistry,
      elementTemplates,
      moddle,
      modeling,
      spaceTool
  ) {
    this._bpmnFactory = bpmnFactory;
    this._bpmnReplace = bpmnReplace;
    this._commandStackPreview = commandStackPreview;
    this._elementFactory = elementFactory;
    this._elementRegistry = elementRegistry;
    this._elementTemplates = elementTemplates;
    this._moddle = moddle;
    this._modeling = modeling;
    this._spaceTool = spaceTool;
  }

  getFunctionDescription() {
    return {
      'name': 'replace-with-element-of-type',
      'parameters': {
        'type': 'object',
        'properties': {
          'type': {
            'type': 'string',
            'description': 'Type of element; e.g. bpmn:Task (must be a valid BPMN 2.0 element type)'
          },
          'eventDefinitionType': {
            'type': 'string',
            'description': 'The optional type of event definition; e.g. bpmn:MessageEventDefinition (must be a valid BPMN 2.0 event definition type)'
          }
        },
        'required': [
          'type'
        ]
      },
      'description': `Can perform the following refactoring action: If an
element's name indicates a completely different element type, it can be
replaced. Replacing only makes sense if the element has a name and the
replacement would be of a different element type. Replacing a user task with a
user task does not make sense. The element type must be a valid BPMN 2.0 type.`.split('\n').map(line => line.trim()).join(' ')
    };
  }

  preview(element, refactoring) {
    this._commandStackPreview.enable();

    const {
      type,
      eventDefinitionType
    } = refactoring;

    const defaultSize = this._elementFactory.getDefaultSize(
      this._elementFactory.createShape({ type })
    );

    this._bpmnReplace.replaceElement(element, {
      type,
      eventDefinitionType,
      x: element.x - (defaultSize.width - element.width) / 2,
      y: element.y - (defaultSize.height - element.height) / 2,
      // width: defaultSize.width,
      // height: defaultSize.height
    });

    return {
      cancel: () => this._commandStackPreview.disable(),
      ok: () => this._commandStackPreview.disable(false),
      elements: this._commandStackPreview.getElementsChanged()
    };
  }

  validate(element, refactoring) {
    return refactoring.name === 'replace-with-element-of-type'
      && this._moddle.getTypeDescriptor(refactoring.arguments.type)
      && this._moddle.getTypeDescriptor(refactoring.arguments.eventDefinitionType)
      && refactoring.arguments.type !== element.type;
  }

  static priority = 1000;
}

ReplaceWithElementOfType.$inject = [
  'bpmnFactory',
  'bpmnReplace',
  'commandStackPreview',
  'elementFactory',
  'elementRegistry',
  'elementTemplates',
  'moddle',
  'modeling',
  'spaceTool'
];