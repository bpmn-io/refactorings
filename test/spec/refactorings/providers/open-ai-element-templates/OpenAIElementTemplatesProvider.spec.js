import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import { CloudElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import ZeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe.json';

import Refactorings from '../../../../../lib/refactorings/Refactorings';

import { FALLBACK_TOOL_NAME } from '../../../../../lib/refactorings/providers/open-ai/OpenAIProvider';

import OpenAIElementTemplatesProvider, {
  idToToolName
} from '../../../../../lib/refactorings/providers/open-ai-element-templates/OpenAIElementTemplatesProvider';

import ElementTemplatesErrorLogger from '../../../ElementTemplatesErrorLogger';

import diagramXML from '../../../../fixtures/bpmn/simple.bpmn';

import elementTemplates from '../../../../fixtures/element-templates/all.json';

describe('OpenAIElementTemplatesProvider', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      CloudElementTemplatesCoreModule,
      ElementTemplatesErrorLogger,
      {
        __init__: [
          'refactorings',
          'openAIElementTemplatesProvider',
        ],
        refactorings: [ 'type', Refactorings ],
        openAIElementTemplatesProvider: [ 'type', OpenAIElementTemplatesProvider ]
      }
    ],
    moddleExtensions: {
      zeebe: ZeebeModdle
    },
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
      }
    },
    elementTemplates
  }));


  describe('_getTools', function() {

    it('should get tools', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      // when
      const tools = openAIElementTemplatesProvider._getTools(element);

      // then
      expect(tools).to.exist;
      expect(tools).to.have.length.above(0);
    }));


    it('should get fallback tool', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      // when
      const tools = openAIElementTemplatesProvider._getTools(element);

      // then
      expect(tools).to.exist;
      expect(tools).to.have.length.above(0);

      expect(tools.find(tool => tool.function.name === FALLBACK_TOOL_NAME)).to.exist;
    }));


    it('should get tools for all Connector element templates available at runtime', inject(
      function(elementRegistry, elementTemplates, openAIElementTemplatesProvider) {

        // given
        const fooTemplate = {
          id: 'foo.template',
          appliesTo: [ 'bpmn:Task' ],
          description: 'foo',
          properties: [],
          category: {
            id: 'connectors',
            name: 'Connectors'
          }
        };

        const barTemplate = {
          id: 'bar.template',
          appliesTo: [ 'bpmn:Task' ],
          description: 'bar',
          properties: []
        };

        elementTemplates.set([
          ...elementTemplates.getAll(),
          fooTemplate,
          barTemplate
        ]);

        const element = elementRegistry.get('Task_1');

        // when
        const tools = openAIElementTemplatesProvider._getTools(element);

        // then
        expect(tools).to.exist;
        expect(tools).to.have.length.above(0);

        const fooTool = tools.find(tool => tool.function.name === 'foo_template');

        expect(fooTool).to.exist;

        const barTool = tools.find(tool => tool.function.name === 'bar_template');

        expect(barTool).not.to.exist;
      }
    ));


    it('should not get tools (element template deprecated)', inject(
      function(elementRegistry, elementTemplates, openAIElementTemplatesProvider) {

        // given
        const fooTemplate = {
          id: 'foo.template',
          appliesTo: [ 'bpmn:Task' ],
          description: 'foo',
          properties: [],
          category: {
            id: 'connectors',
            name: 'Connectors'
          },
          deprecated: {
            message: 'foo'
          }
        };

        elementTemplates.set([
          ...elementTemplates.getAll(),
          fooTemplate
        ]);

        const element = elementRegistry.get('Task_1');

        // when
        const tools = openAIElementTemplatesProvider._getTools(element);

        // then
        expect(tools).to.exist;
        expect(tools).to.have.length.above(0);

        const fooTool = tools.find(tool => tool.function.name === 'foo_template');

        expect(fooTool).not.to.exist;
      }
    ));


    it('should get no tools (no applicable element template)', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Flow_1');

      // when
      const tools = openAIElementTemplatesProvider._getTools(element);

      // then
      expect(tools).to.exist;
      expect(tools).to.have.length(0);
    }));


    it('should create function description from element template description', inject(
      function(elementRegistry, elementTemplates, openAIElementTemplatesProvider) {

        // given
        const fooTemplate = {
          id: 'foo.template',
          appliesTo: [ 'bpmn:Task' ],
          description: 'foo',
          properties: [],
          category: {
            id: 'connectors',
            name: 'Connectors'
          }
        };

        elementTemplates.set([
          ...elementTemplates.getAll(),
          fooTemplate
        ]);

        const element = elementRegistry.get('Task_1');

        // when
        const tools = openAIElementTemplatesProvider._getTools(element);

        // then
        expect(tools).to.exist;
        expect(tools).to.have.length.above(0);

        const fooTool = tools.find(tool => tool.function.name === 'foo_template');

        expect(fooTool).to.exist;
        expect(fooTool.function.description).to.eql(`# Description:
"foo"`);
      }
    ));


    it('should create function description from element template description and keywords', inject(
      function(elementRegistry, elementTemplates, openAIElementTemplatesProvider) {

        // given
        const fooTemplate = {
          id: 'foo.template',
          appliesTo: [ 'bpmn:Task' ],
          description: 'foo',
          properties: [],
          category: {
            id: 'connectors',
            name: 'Connectors'
          },
          metadata: {
            keywords: [
              'bar',
              'baz'
            ]
          }
        };

        elementTemplates.set([
          ...elementTemplates.getAll(),
          fooTemplate
        ]);

        const element = elementRegistry.get('Task_1');

        // when
        const tools = openAIElementTemplatesProvider._getTools(element);

        // then
        expect(tools).to.exist;
        expect(tools).to.have.length.above(0);

        const fooTool = tools.find(tool => tool.function.name === 'foo_template');

        expect(fooTool).to.exist;
        expect(fooTool.function.description).to.eql(`# Description:
"foo"
# Keywords:
- "bar"
- "baz"`);
      }
    ));

  });


  describe('_getRefactorings', function() {

    it('should get refactorings', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      const toolCalls = [
        {
          name: idToToolName('io.camunda.connectors.Asana.v1'),
          arguments: {}
        },
        {
          name: idToToolName('io.camunda.connectors.AutomationAnywhere'),
          arguments: {}
        },
        {
          name: idToToolName('io.camunda.connectors.AWSDynamoDB.v1'),
          arguments: {}
        }
      ];

      // when
      const refactorings = openAIElementTemplatesProvider._getRefactorings(element, toolCalls);

      // then
      expect(refactorings).to.exist;
      expect(refactorings).to.have.length(3);
    }));


    it('should not get duplicate refactorings', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      const toolCalls = [
        {
          name: idToToolName('io.camunda.connectors.Asana.v1'),
          arguments: {}
        },
        {
          name: idToToolName('io.camunda.connectors.AutomationAnywhere'),
          arguments: {}
        },
        {
          name: idToToolName('io.camunda.connectors.AutomationAnywhere'),
          arguments: {}
        }
      ];

      // when
      const refactorings = openAIElementTemplatesProvider._getRefactorings(element, toolCalls);

      // then
      expect(refactorings).to.exist;
      expect(refactorings).to.have.length(2);
    }));


    it('should refactorings alphabetically sorted', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      const toolCalls = [
        {
          name: idToToolName('io.camunda.connectors.Asana.v1'),
          arguments: {}
        },
        {
          name: idToToolName('io.camunda.connectors.AWSDynamoDB.v1'),
          arguments: {}
        },
        {
          name: idToToolName('io.camunda.connectors.AutomationAnywhere'),
          arguments: {}
        }
      ];

      // when
      const refactorings = openAIElementTemplatesProvider._getRefactorings(element, toolCalls);

      // then
      expect(refactorings).to.exist;
      expect(refactorings).to.have.length(3);
      expect(refactorings[0].label).to.equal('Apply Asana Outbound Connector template');
      expect(refactorings[1].label).to.equal('Apply Automation Anywhere Outbound Connector template');
      expect(refactorings[2].label).to.equal('Apply AWS DynamoDB Outbound Connector template');
    }));

  });


  describe('events', function() {

    it('should fire event when executing refactoring', inject(function(elementRegistry, eventBus, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      const toolCalls = [
        {
          name: idToToolName('io.camunda.connectors.Asana.v1'),
          arguments: {}
        }
      ];

      const refactorings = openAIElementTemplatesProvider._getRefactorings(element, toolCalls);

      expect(refactorings).to.exist;
      expect(refactorings).to.have.length(1);

      const spy = sinon.spy();

      eventBus.on('refactorings.execute', spy);

      // when
      refactorings[0].execute([ element ]);

      // then
      expect(spy).to.have.been.calledOnce;
    }));

  });

});