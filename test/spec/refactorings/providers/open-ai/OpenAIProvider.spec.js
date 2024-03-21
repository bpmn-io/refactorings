import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import { ElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import Refactorings from '../../../../../lib/refactorings/Refactorings';

import OpenAIProvider from '../../../../../lib/refactorings/providers/open-ai/OpenAIProvider';

import createElementTemplateHandlerClass from '../../../../../lib/refactorings/providers/open-ai/handlers/createElementTemplateHandlerClass';

import diagramXML from '../../../../fixtures/bpmn/simple.bpmn';

describe('OpenAIProvider', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      ElementTemplatesCoreModule,
      {
        __init__: [
          'refactorings',
          'openAIProvider'
        ],
        refactorings: [ 'type', Refactorings ],
        openAIProvider: [ 'type', OpenAIProvider ]
      }
    ],
    openai: {
      chat: {
        completions: {
          create: () => {}
        }
      }
    },
    elementTemplates: [
      {
        id: 'foobar',
        name: 'Foobar',
        appliesTo: [ 'bpmn:Task' ],
        properties: []
      }
    ]
  }));


  it('should get refactoring', inject(async function(config, elementRegistry, refactorings) {

    // given
    const fake = sinon.replace(config.openai.chat.completions, 'create', sinon.fake.returns({
      choices:[
        {
          message: {
            tool_calls: [
              {
                function: {
                  name: 'template_Slack_v1',
                  arguments: '{}'
                }
              }
            ]
          }
        }
      ]
    }));

    const elements = [
      elementRegistry.get('Task_1')
    ];

    // when
    const refactoring = await refactorings.getRefactorings(elements);

    // then
    expect(refactoring).to.have.length(1);
    expect(refactoring[0].id).to.equal('template_Slack_v1');
    expect(fake).to.have.been.called;
  }));


  it('should not get refactoring (more than one element)', inject(async function(config, elementRegistry, refactorings) {

    // given
    const fake = sinon.replace(config.openai.chat.completions, 'create', sinon.fake());

    const elements = [
      elementRegistry.get('StartEvent_1'),
      elementRegistry.get('Task_1')
    ];

    // when
    const refactoring = await refactorings.getRefactorings(elements);

    // then
    expect(refactoring).to.have.length(0);
    expect(fake).to.not.have.been.called;
  }));


  describe('handlers', function() {

    describe('ElementTemplateHandler', function() {

      it('should create ElementTemplateHandler class', inject(function(injector) {

        // given
        // when
        const Handler = createElementTemplateHandlerClass('foobar', 'Foobar');

        const handler = injector.instantiate(Handler);

        // then
        expect(handler).to.exist;
      }));


      it('should be able to execute if appliesTo matching', inject(function(elementRegistry, injector) {

        // given
        const Handler = createElementTemplateHandlerClass('foobar', 'Foobar');

        const handler = injector.instantiate(Handler);

        const element = elementRegistry.get('Task_1');

        // when
        const canExecute = handler.canExecute(element);

        // then
        expect(canExecute).to.be.true;
      }));


      it('should not be able to execute if appliesTo not matching', inject(function(elementRegistry, injector) {

        // given
        const Handler = createElementTemplateHandlerClass('foobar', 'Foobar');

        const handler = injector.instantiate(Handler);

        const element = elementRegistry.get('StartEvent_1');

        // when
        const canExecute = handler.canExecute(element);

        // then
        expect(canExecute).to.be.false;
      }));


      it('should not be able to execute if element template not found', inject(function(elementRegistry, injector) {

        // given
        const Handler = createElementTemplateHandlerClass('barbaz', 'Barbaz');

        const handler = injector.instantiate(Handler);

        const element = elementRegistry.get('Task_1');

        // when
        const canExecute = handler.canExecute(element);

        // then
        expect(canExecute).to.be.false;
      }));

    });

  });

});