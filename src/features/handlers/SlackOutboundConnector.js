import Template from '../templates/slack-outbound.json';

/**
 * This module provides the handler for the Slack outbound connector refactoring.
 *
 * @implements {import("./Handler").default}
 */
export default class SlackOutboundConnector {
  constructor(bpmnFactory, complexPreview, elementFactory, moddleCopy, elementTemplates) {
    this._bpmnFactory = bpmnFactory;
    this._complexPreview = complexPreview;
    this._elementFactory = elementFactory;
    this._moddleCopy = moddleCopy;
    this._elementTemplates = elementTemplates;
  }

  getMetaData() {
    return {
      id: 'slack-outbound-connector',
      description: 'An intermediate throw event or send task "Send Slack message" can be replaced with an intermediate throw event with a Slack outbound connector template applied. Example input: Task "Send Slack notification" Example output: { "id": "slack-outbound-connector" }'
    };
  }

  refactor(element, refactoring) {
    this._elementTemplates.applyTemplate(element, Template);
  }

  preview(element, refactoring) {
    const { businessObject } = element;

    const newBusinessObject = this._bpmnFactory.create(businessObject.$type);

    this._moddleCopy.copyElement(businessObject, newBusinessObject);

    newBusinessObject.set('zeebe:modelerTemplateIcon', Template.icon.contents);

    const newElement = this._elementFactory.createShape({
      type: newBusinessObject.$type,
      businessObject: newBusinessObject,
      x: element.x,
      y: element.y
    });

    this._complexPreview.create({
      removed: [
        element
      ],
      created: [
        newElement
      ]
    });

    return () => this._complexPreview.cleanUp();
  }

  static priority = 1000;
}

SlackOutboundConnector.$inject = [ 'bpmnFactory', 'complexPreview', 'elementFactory', 'moddleCopy', 'elementTemplates' ];