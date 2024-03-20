import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import { ElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import Refactorings from '../../../../../lib/refactorings/Refactorings';

import OpenAIProvider from '../../../../../lib/refactorings/providers/open-ai/OpenAIProvider';

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
    }
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

});