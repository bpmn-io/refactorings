import Template from '../templates/slack-outbound.json' with { type: "json" };

/**
 * This module provides the handler for the Slack outbound connector refactoring.
 *
 * @implements {import("./Handler").default}
 */
export default class SlackOutboundConnector {
  constructor(
      elementTemplates
  ) {
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

  execute(element, refactoring) {
    this._elementTemplates.applyTemplate(element, Template);
  }

  validate(element, refactoring) {
    return refactoring.name === 'slack-outbound-connector';
  }

  static priority = 1000;
}

SlackOutboundConnector.$inject = [
  'elementTemplates'
];