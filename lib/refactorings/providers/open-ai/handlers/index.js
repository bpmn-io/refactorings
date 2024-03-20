import createElementTemplateHandlerClass from './createElementTemplateHandlerClass';

const elementTemplateDescriptions = {
  'io.camunda.connectors.Slack.v1': 'A Slack outbound connector that can be applied to an element with a name similar to "Send Slack notification."',
  'io.camunda.connectors.inbound.Slack.BoundaryEvent.v1': 'A Slack inbound connector that can be applied to a boundary event with a name similar to "Receive Slack notification."',
  'io.camunda.connectors.inbound.Slack.IntermediateCatchEvent.v1': 'A Slack inbound connector that can be applied to an intermediate catch event with a name similar to "Receive Slack notification."',
  'io.camunda.connectors.inbound.Slack.MessageStartEvent.v1': 'A Slack inbound connector that can be applied to a message start event with a name similar to "Receive Slack notification."',
  'io.camunda.connectors.inbound.Slack.StartEvent.v1': 'A Slack inbound connector that can be applied to a start event with a name similar to "Receive Slack notification."'
};


let handlers = [];

Object.entries(elementTemplateDescriptions).forEach(([ id, description ]) => {
  handlers.push(createElementTemplateHandlerClass(id, description));
});

export default handlers;