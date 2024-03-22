import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { isString } from 'min-dash';

function getEventDefinition(node) {
  const eventDefinitions = node.get('eventDefinitions');

  return eventDefinitions && eventDefinitions[ 0 ];
}

function getLocalType(node) {
  const { $descriptor } = node;

  const { localName } = $descriptor.ns;

  return localName;
}

function getEventDefinitionPrefix(eventDefinition) {
  const localType = getLocalType(eventDefinition);

  return localType.replace('EventDefinition', '');
}

export function typeToString(node) {
  let type = getLocalType(node);

  const eventDefinition = getEventDefinition(node);

  if (eventDefinition) {
    type = `${ getEventDefinitionPrefix(eventDefinition) }${ type }`;
  }

  return type.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

export function isEmptyString(value) {
  return isString(value) && !value.trim().length;
}

export function isExactly(element, type) {
  const businessObject = getBusinessObject(element);

  const { $model } = businessObject;

  return $model.getType(businessObject.$type) === $model.getType(type);
}

export function isAnyExactly(element, types) {
  return types.some(type => isExactly(element, type));
}

export function elementTemplateIdToToolName(id) {
  const name = `template_${id.replace('io.camunda.connectors.', '').replace(/\./g, '_')}`;

  if (name.length > 64) {
    throw new Error(`tool name ${name} exceeds maximum length of 64 characters`);
  }

  return name;
}

export function toolNameToElementTemplateId(name) {
  return `io.camunda.connectors.${name.replace('template_', '').replace(/_/g, '.')}`;
}