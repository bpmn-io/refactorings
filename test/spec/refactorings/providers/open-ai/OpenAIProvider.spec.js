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
      openai: {
        createChatCompletion: () => ({
          choices: [
            {
              message: {
                content: 'Foobar'
              }
            }
          ]
        })
      },
      debug: true
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


  it('should get refactorings', inject(async function(elementRegistry, openAIProvider, refactorings) {

    // given
    const spy = sinon.stub(openAIProvider._openAIClient, 'getToolCalls').callsFake(() => {
      return Promise.resolve([ { name: 'template_Slack_v1', arguments: {} } ]);
    });

    const elements = [
      elementRegistry.get('Task_1')
    ];

    // when
    const _refactorings = await refactorings.getRefactorings(elements);

    // then
    expect(_refactorings).to.have.length(1);
    expect(_refactorings[0].id).to.equal('template_Slack_v1');
    expect(_refactorings[0].label).to.equal('Apply Slack Outbound Connector template');
    expect(spy).to.have.been.called;
  }));


  it('should not get refactoring (more than one element)', inject(async function(elementRegistry, openAIProvider, refactorings) {

    // given
    const spy = sinon.stub(openAIProvider._openAIClient, 'getToolCalls').callsFake(() => {
      return Promise.resolve([ { name: 'template_Slack_v1', arguments: {} } ]);
    });

    const elements = [
      elementRegistry.get('StartEvent_1'),
      elementRegistry.get('Task_1')
    ];

    // when
    const _refactorings = await refactorings.getRefactorings(elements);

    // then
    expect(_refactorings).to.have.length(0);
    expect(spy).to.not.have.been.called;
  }));


  it('should not get refactoring (unknown)', inject(async function(elementRegistry, openAIProvider, refactorings) {

    // given
    const spy = sinon.stub(openAIProvider._openAIClient, 'getToolCalls').callsFake(() => {
      return Promise.resolve([ { name: 'template_MySpace_v1', arguments: {} } ]);
    });

    const elements = [
      elementRegistry.get('Task_1')
    ];

    // when
    const _refactorings = await refactorings.getRefactorings(elements);

    // then
    expect(_refactorings).to.have.length(0);
    expect(spy).to.have.been.called;
  }));


  describe('caching', function() {

    it('should return cached', inject(async function(elementRegistry, openAIProvider, refactorings) {

      // given
      const spy = sinon.stub(openAIProvider._openAIClient, 'getToolCalls').callsFake(() => {
        return Promise.resolve([ { name: 'template_Slack_v1', arguments: {} } ]);
      });

      const elements = [
        elementRegistry.get('Task_1')
      ];

      const refactorings1 = await refactorings.getRefactorings(elements);

      expect(refactorings1).to.have.length(1);
      expect(refactorings1[0].id).to.equal('template_Slack_v1');
      expect(spy).to.have.been.called;

      spy.resetHistory();

      // when
      const refactorings2 = await refactorings.getRefactorings(elements);

      // then
      expect(refactorings2).to.have.length(1);
      expect(refactorings2[0].id).to.equal('template_Slack_v1');
      expect(spy).not.to.have.been.called;
    }));


    it('should update ID of cached on element ID change', inject(async function(elementRegistry, modeling, openAIProvider, refactorings) {

      // given
      const spy = sinon.stub(openAIProvider._openAIClient, 'getToolCalls').callsFake(() => {
        return Promise.resolve([ { name: 'template_Slack_v1', arguments: {} } ]);
      });

      const elements = [
        elementRegistry.get('Task_1')
      ];

      const refactorings1 = await refactorings.getRefactorings(elements);

      expect(refactorings1).to.have.length(1);
      expect(refactorings1[0].id).to.equal('template_Slack_v1');
      expect(spy).to.have.been.called;

      spy.resetHistory();

      // when
      modeling.updateProperties(elements[0], { id: 'Task_2' });

      const refactorings2 = await refactorings.getRefactorings(elements);

      // then
      expect(refactorings2).to.have.length(1);
      expect(refactorings2[0].id).to.equal('template_Slack_v1');
      expect(spy).not.to.have.been.called;
    }));


    it('shoud delete cached on element name change', inject(async function(elementRegistry, modeling, openAIProvider, refactorings) {

      // given
      const spy = sinon.stub(openAIProvider._openAIClient, 'getToolCalls').callsFake(() => {
        return Promise.resolve([ { name: 'template_Slack_v1', arguments: {} } ]);
      });

      const elements = [
        elementRegistry.get('Task_1')
      ];

      const refactorings1 = await refactorings.getRefactorings(elements);

      expect(refactorings1).to.have.length(1);
      expect(refactorings1[0].id).to.equal('template_Slack_v1');
      expect(spy).to.have.been.called;

      spy.resetHistory();

      // when
      modeling.updateProperties(elements[0], { name: 'Send Slack notification to John' });

      const refactorings2 = await refactorings.getRefactorings(elements);

      // then
      expect(refactorings2).to.have.length(1);
      expect(refactorings2[0].id).to.equal('template_Slack_v1');
      expect(spy).to.have.been.called;
    }));


    it('should delete cached on element removed', inject(async function(
        bpmnFactory, canvas, elementRegistry, modeling, openAIProvider, refactorings) {

      // given
      const spy = sinon.stub(openAIProvider._openAIClient, 'getToolCalls').callsFake(() => {
        return Promise.resolve([ { name: 'template_Slack_v1', arguments: {} } ]);
      });

      const elements = [
        elementRegistry.get('Task_1')
      ];

      const refactorings1 = await refactorings.getRefactorings(elements);

      expect(refactorings1).to.have.length(1);
      expect(refactorings1[0].id).to.equal('template_Slack_v1');
      expect(spy).to.have.been.called;

      spy.resetHistory();

      // when
      modeling.removeShape(elements[0]);

      modeling.createShape({
        type: 'bpmn:Task',
        businessObject: bpmnFactory.create('bpmn:Task', {
          id: 'Task_1',
          name: 'Send Slack notification to John'
        })
      }, { x: 100, y: 100 }, canvas.getRootElement());

      const refactorings2 = await refactorings.getRefactorings(elements);

      // then
      expect(refactorings2).to.have.length(1);
      expect(refactorings2[0].id).to.equal('template_Slack_v1');
      expect(spy).to.have.been.called;
    }));

  });


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