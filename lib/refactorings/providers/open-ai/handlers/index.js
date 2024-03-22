import createElementTemplateHandlerClass from './createElementTemplateHandlerClass';

import elementTemplateHandlerDescriptions from './elementTemplateHandlerDescriptions.json';

const elementTemplateHandlers = Object.entries(elementTemplateHandlerDescriptions).map(([ id, description ]) => {
  return createElementTemplateHandlerClass(id, description);
});

export default [
  ...elementTemplateHandlers
];