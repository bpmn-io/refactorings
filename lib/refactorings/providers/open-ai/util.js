/**
 * @typedef {import('bpmn-js/lib/model/Types').ModdleElement} ModdleElement
 */

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { isString } from 'min-dash';

/**
 * @param {ModdleElement} element
 *
 * @returns {ModdleElement}
 */
function getEventDefinition(element) {
  const eventDefinitions = element.get('eventDefinitions');

  return eventDefinitions && eventDefinitions[ 0 ];
}

/**
 * @param {ModdleElement|string} elementOrType
 *
 * @returns {string}
 */
function getLocalType(elementOrType) {
  if (isString(elementOrType)) {
    return elementOrType.split(':').pop();
  }

  const { $descriptor } = elementOrType;

  const { localName } = $descriptor.ns;

  return localName;
}

/**
 * @param {ModdleElement|string} eventDefinitionOrType
 *
 * @returns {string}
 */
function getEventDefinitionPrefix(eventDefinitionOrType) {
  const localType = getLocalType(eventDefinitionOrType);

  return localType.replace('EventDefinition', '');
}

/**
 * Get type of an element or type as user-friendly string.
 *
 * @param {ModdleElement|string} elementOrType
 * @param {string} [eventDefinitionType]
 *
 * @returns {string}
 */
export function typeToString(elementOrType, eventDefinitionType) {
  let type = getLocalType(elementOrType);

  if (isString(elementOrType)) {

    if (eventDefinitionType) {
      type = `${ getEventDefinitionPrefix(eventDefinitionType) }${ type }`;
    }
  } else {
    const eventDefinition = getEventDefinition(elementOrType);

    if (eventDefinition) {
      type = `${ getEventDefinitionPrefix(eventDefinition) }${ type }`;
    }
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

const CONNECTORS_PREFIX = 'io.camunda.connectors.';

export function elementTemplateIdToToolName(id) {
  const name = `template_${id.replace(CONNECTORS_PREFIX, '').replace(/\./g, '_')}`;

  if (name.length > 64) {
    throw new Error(`tool name ${name} exceeds maximum length of 64 characters`);
  }

  return name;
}

export function toolNameToElementTemplateId(name) {
  return `${ CONNECTORS_PREFIX }${name.replace('template_', '').replace(/_/g, '.')}`;
}