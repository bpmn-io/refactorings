import Template from '../templates/slack-outbound.json';

/**
 * This module provides the handler for the Slack outbound connector refactoring.
 *
 * @implements {import("./Handler").default}
 */
export default class SlackOutboundConnector {
  constructor(
      commandStackPreview,
      elementTemplates
  ) {
    this._commandStackPreview = commandStackPreview;
    this._elementTemplates = elementTemplates;
  }

  getFunctionDescription() {
    return {
      name: 'slack-outbound-connector',
      label: 'Slack Outbound Connector',
      parameters: {
        'type': 'object',
        'properties': {},
        'required': []
      },
      description: `Can perform the following refactoring action: A Slack
outbound connector that can be applied to an element with a name similar to
"Send Slack notification.`.split('\n').map(line => line.trim()).join(' '),
    };
  }

  preview(element, refactoring) {
    this._commandStackPreview.enable();

    this._elementTemplates.applyTemplate(element, Template);

    return {
      cancel: () => this._commandStackPreview.disable(),
      ok: () => this._commandStackPreview.disable(false),
      elements: this._commandStackPreview.getElementsChanged()
    };
  }

  validate(element, refactoring) {
    return refactoring.name === 'slack-outbound-connector';
  }

  static priority = 1000;
}

SlackOutboundConnector.$inject = [
  'commandStackPreview',
  'elementTemplates'
];