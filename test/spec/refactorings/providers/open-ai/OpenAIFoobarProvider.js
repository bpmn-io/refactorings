import OpenAIProvider from '../../../../../lib/refactorings/providers/open-ai/OpenAIProvider';

export default class OpenAIFoobarProvider extends OpenAIProvider {
  constructor(config = {}, eventBus, refactorings) {
    super(config, eventBus, refactorings);
  }

  execute() {}

  getLabel() {
    return 'Foobar';
  }

  getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'foobar',
          description: 'Foobar',
        }
      }
    ];
  }
}

OpenAIFoobarProvider.$inject = [
  'config.refactorings',
  'eventBus',
  'refactorings'
];