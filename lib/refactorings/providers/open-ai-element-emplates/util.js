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