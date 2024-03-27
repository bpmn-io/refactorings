class ElementTemplatesErrorLogger {
  constructor(eventBus) {
    eventBus.on('elementTemplates.errors', ({ errors }) => {
      console.error('elementTemplates.errors', errors.map(({ message }) => message));
    });
  }
}

ElementTemplatesErrorLogger.$inject = [ 'eventBus' ];

export default {
  __init__: [ 'elementTemplatesErrorLogger' ],
  elementTemplatesErrorLogger: [ 'type', ElementTemplatesErrorLogger ]
};