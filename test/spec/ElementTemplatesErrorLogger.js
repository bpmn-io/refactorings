class ElementTemplatesErrorLogger {
  constructor(eventBus) {
    eventBus.on('elementTemplates.errors', ({ errors }) => {
      console.error('elementTemplates.errors', errors);
    });
  }
}

ElementTemplatesErrorLogger.$inject = [ 'eventBus' ];

export default {
  __init__: [ 'elementTemplatesErrorLogger' ],
  elementTemplatesErrorLogger: [ 'type', ElementTemplatesErrorLogger ]
};