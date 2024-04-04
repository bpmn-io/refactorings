const CONNECTORS_PREFIX = 'io.camunda.connectors.';

/**
 * Create tool name from element template ID. Removes prefix and version from ID
 * and replaces dots with underscores.
 *
 * @param {string} id
 *
 * @returns {string}
 */
export function elementTemplateIdToToolName(id) {
  const name = `${id.replace(CONNECTORS_PREFIX, '').replace(/.v[0-9]+/, '').replace(/\./g, '_')}`;

  if (name.length > 64) {
    throw new Error(`tool name ${name} exceeds maximum length of 64 characters`);
  }

  return name;
}