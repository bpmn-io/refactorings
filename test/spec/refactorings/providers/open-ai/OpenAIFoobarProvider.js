import OpenAIProvider from '../../../../../lib/refactorings/providers/open-ai/OpenAIProvider';

export default class OpenAIFoobarProvider extends OpenAIProvider {
  constructor(config = {}, eventBus, refactorings) {
    super(config, eventBus, refactorings);
  }

  _getRefactorings() {
    return [
      {
        id: 'foobar',
        label: 'Foobar',
        execute: () => {}
      }
    ];
  }

  _getTools() {
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