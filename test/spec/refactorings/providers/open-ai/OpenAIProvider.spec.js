import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import { CloudElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import Refactorings from '../../../../../lib/refactorings/Refactorings';

import OpenAIProvider from '../../../../../lib/refactorings/providers/open-ai/OpenAIProvider';

import createElementTemplateHandlerClass from '../../../../../lib/refactorings/providers/open-ai/handlers/createElementTemplateHandlerClass';

import ElementTemplatesErrorLogger from '../../../ElementTemplatesErrorLogger';

import diagramXML from '../../../../fixtures/bpmn/simple.bpmn';

import elementTemplateHandlerDescriptions from '../../../../../lib/refactorings/providers/open-ai/handlers/elementTemplateHandlerDescriptions.json';

import elementTemplates from '../../../../fixtures/element-templates/all.json';

describe('OpenAIProvider', function() {

  const openai = {
    createChatCompletion: sinon.fake.returns({
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
    })
  };

  beforeEach(function() {
    openai.createChatCompletion.resetHistory();
  });

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      CloudElementTemplatesCoreModule,
      ElementTemplatesErrorLogger,
      {
        __init__: [
          'refactorings',
          'openAIProvider',
        ],
        refactorings: [ 'type', Refactorings ],
        openAIProvider: [ 'type', OpenAIProvider ],
      }
    ],
    refactorings: {
      openai
    },
    elementTemplates: [
      ...elementTemplates,
      {
        $schema: 'https://unpkg.com/@camunda/zeebe-element-templates-json-schema/resources/schema.json',
        id: 'foobar',
        name: 'Foobar',
        appliesTo: [ 'bpmn:Task' ],
        properties: []
      },
      {
        $schema: 'https://unpkg.com/@camunda/zeebe-element-templates-json-schema/resources/schema.json',
        id: 'foobar-deprecated',
        name: 'Foobar Deprecated',
        appliesTo: [ 'bpmn:Task' ],
        properties: [],
        deprecated: {
          message: 'Foobar is deprecated.',
          documentationRef: 'https://foobar.com/docs'
        }
      }
    ]
  }));


  it('should have handler for each element template', inject(function(openAIProvider) {

    // when
    const handlers = openAIProvider._handlers;

    // then
    expect(handlers).to.have.length(Object.keys(elementTemplateHandlerDescriptions).length);
  }));


  it('should get refactoring', inject(async function(elementRegistry, refactorings) {

    // given
    const elements = [
      elementRegistry.get('Task_1')
    ];

    // when
    const refactoring = await refactorings.getRefactorings(elements);

    // then
    expect(refactoring).to.have.length(1);
    expect(refactoring[0].id).to.equal('template_Slack_v1');
    expect(refactoring[0].label).to.equal('Apply Slack Outbound Connector template');
    expect(openai.createChatCompletion).to.have.been.called;
  }));


  it('should not get refactoring (more than one element)', inject(async function(elementRegistry, refactorings) {

    // given
    const elements = [
      elementRegistry.get('StartEvent_1'),
      elementRegistry.get('Task_1')
    ];

    // when
    const refactoring = await refactorings.getRefactorings(elements);

    // then
    expect(refactoring).to.have.length(0);
    expect(openai.createChatCompletion).to.not.have.been.called;
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


      it('should not be able to execute if element template deprecated', inject(function(elementRegistry, injector) {

        // given
        const Handler = createElementTemplateHandlerClass('foobar-deprecated', 'Foobar Deprecated');

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