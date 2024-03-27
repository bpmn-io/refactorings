import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import { CloudElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import Refactorings from '../../../../../lib/refactorings/Refactorings';

import OpenAIElementTemplatesProvider from '../../../../../lib/refactorings/providers/open-ai-element-emplates/OpenAIElementTemplatesProvider';

import { toolNameToElementTemplateId } from '../../../../../lib/refactorings/providers/open-ai-element-emplates/util';

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
        openAIElementTemplatesProvider: [ 'type', OpenAIElementTemplatesProvider ],
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


  describe('getTools', function() {

    it('should get tools', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      // when
      const tools = openAIElementTemplatesProvider.getTools(element);

      // then
      expect(tools).to.exist;
      expect(tools).to.have.length(28);
    }));


    it('should not get deprecated tools', inject(function(elementRegistry, elementTemplates, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Task_1');

      // when
      const tools = openAIElementTemplatesProvider.getTools(element);

      // then
      tools.forEach(tool => {
        const elementTemplateId = toolNameToElementTemplateId(tool.function.name);

        const elementTemplate = elementTemplates.getLatest(elementTemplateId);

        expect(elementTemplate).to.exist;
        expect(elementTemplate.deprecated).not.to.exist;
      });
    }));


    it('should get no tools (no applicable element template)', inject(function(elementRegistry, openAIElementTemplatesProvider) {

      // given
      const element = elementRegistry.get('Flow_1');

      // when
      const tools = openAIElementTemplatesProvider.getTools(element);

      // then
      expect(tools).to.exist;
      expect(tools).to.have.length(0);
    }));


  });

});