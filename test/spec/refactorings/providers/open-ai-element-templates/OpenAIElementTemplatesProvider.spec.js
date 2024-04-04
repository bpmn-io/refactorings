import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { CloudElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import Refactorings from '../../../../../lib/refactorings/Refactorings';

import { FALLBACK_TOOL_NAME } from '../../../../../lib/refactorings/providers/open-ai/OpenAIProvider';

import OpenAIElementTemplatesProvider from '../../../../../lib/refactorings/providers/open-ai-element-templates/OpenAIElementTemplatesProvider';

import elementTemplateToolDescriptions from '../../../../../lib/refactorings/providers/open-ai-element-templates/elementTemplateToolDescriptions.json';

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


    it('should ony get tools for applicable element templates', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      // when
      const tools = openAIElementTemplatesProvider._getTools(element);

      // then
      expect(tools).to.exist;
      expect(tools).to.have.length.above(0);

      tools
        .filter(tool => tool.function.name !== FALLBACK_TOOL_NAME)
        .forEach(tool => {
          const toolDescription = elementTemplateToolDescriptions[ tool.function.name ];

          expect(toolDescription).to.exist;

          expect(toolDescription.appliesTo.includes(getBusinessObject(element).$type)).to.be.true;
        });
    }));


    it('should not get tools for deprecated element templates', inject(function(elementRegistry, elementTemplates, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      // when
      const tools = openAIElementTemplatesProvider._getTools(element);

      // then
      expect(tools).to.exist;
      expect(tools).to.have.length.above(0);

      tools
        .filter(tool => tool.function.name !== FALLBACK_TOOL_NAME)
        .forEach(tool => {
          const toolDescription = elementTemplateToolDescriptions[ tool.function.name ];

          expect(toolDescription).to.exist;

          toolDescription.elementTemplates.forEach(elementTemplateId => {
            const latestElementTemplates = elementTemplates.getLatest(elementTemplateId);

            expect(latestElementTemplates).to.exist;
            expect(latestElementTemplates).to.have.length.above(0);

            const [ latestElementTemplate ] = latestElementTemplates;

            expect(latestElementTemplate).to.exist;
            expect(latestElementTemplate.deprecated).not.to.exist;
          });
        });
    }));


    it('should get no tools (no applicable element template)', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Flow_1');

      // when
      const tools = openAIElementTemplatesProvider._getTools(element);

      // then
      expect(tools).to.exist;
      expect(tools).to.have.length(0);
    }));


  });


  describe('_getRefactorings', function() {

    it('should get refactorings', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      const toolCalls = [
        {
          name: 'slack_task',
          arguments: {}
        },
        {
          name: 'twilio_task',
          arguments: {}
        },
        {
          name: 'whatsappbusiness_task',
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
          name: 'slack_task',
          arguments: {}
        },
        {
          name: 'twilio_task',
          arguments: {}
        },
        {
          name: 'twilio_task',
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
          name: 'slack_task',
          arguments: {}
        },
        {
          name: 'whatsappbusiness_task',
          arguments: {}
        },
        {
          name: 'twilio_task',
          arguments: {}
        }
      ];

      // when
      const refactorings = openAIElementTemplatesProvider._getRefactorings(element, toolCalls);

      // then
      expect(refactorings).to.exist;
      expect(refactorings).to.have.length(3);
      expect(refactorings[0].label).to.equal('Apply Slack Outbound Connector template');
      expect(refactorings[1].label).to.equal('Apply Twilio Outbound Connector template');
      expect(refactorings[2].label).to.equal('Apply WhatsApp Business Outbound Connector template');
    }));

  });

});