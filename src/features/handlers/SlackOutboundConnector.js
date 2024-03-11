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

  getMetaData() {
    return {
      id: 'slack-outbound-connector',
      label: 'Replace with Outbound Connector',
      description: `An intermediate throw event or send task "Send Slack
message" can be replaced with an intermediate throw event with a Slack outbound
connector template applied. Example input: Task "Send Slack notification"
Example output: { "id": "slack-outbound-connector" }`.split('\n').map(line => line.trim()).join(' '),
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

  static priority = 1000;
}

SlackOutboundConnector.$inject = [
  'commandStackPreview',
  'elementTemplates'
];