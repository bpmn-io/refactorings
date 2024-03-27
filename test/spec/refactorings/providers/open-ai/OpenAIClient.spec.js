import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import OpenAIClient, {
  DEFAULT_GET_USER_PROMPT,
  DEFAULT_MODEL,
  DEFAULT_SEED,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TEMPERATURE
} from '../../../../../lib/refactorings/providers/open-ai/OpenAIClient';

import diagramXML from '../../../../fixtures/bpmn/simple.bpmn';

describe('OpenAIClient', function() {

  beforeEach(bootstrapModeler(diagramXML));


  describe('configuration', function() {

    it('default', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('Task_1');

      const stub = sinon.stub().resolves(getMockResponse());

      // when
      const openAIClient = new OpenAIClient({
        createChatCompletion: stub
      });

      openAIClient.getToolCalls(element, getMockTools());

      // then
      expect(stub).to.have.been.calledWithMatch({
        messages: [
          {
            'role': 'system',
            'content': DEFAULT_SYSTEM_PROMPT
          },
          {
            'role': 'user',
            'content': DEFAULT_GET_USER_PROMPT(element)
          }
        ],
        model: DEFAULT_MODEL,
        seed: DEFAULT_SEED,
        temperature: DEFAULT_TEMPERATURE
      });
    }));


    it('custom', inject(function(elementRegistry) {

      // given
      const element = elementRegistry.get('Task_1');

      const stub = sinon.stub().resolves(getMockResponse());

      // when
      const openAIClient = new OpenAIClient({
        createChatCompletion: stub,
        getUserPrompt: () => 'Bar',
        model: 'gpt-3.5-turbo',
        seed: 0,
        systemPrompt: 'Foo',
        temperature: 0.7
      });

      openAIClient.getToolCalls(element, getMockTools());

      // then
      expect(stub).to.have.been.calledWithMatch({
        messages: [
          {
            'role': 'system',
            'content': 'Foo'
          },
          {
            'role': 'user',
            'content': 'Bar'
          }
        ],
        model: 'gpt-3.5-turbo',
        seed: 0,
        temperature: 0.7
      });
    }));

  });

});

function getMockTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'foo',
        description: 'Foo'
      }
    }
  ];
}

function getMockResponse() {
  return {
    choices: []
  };
}