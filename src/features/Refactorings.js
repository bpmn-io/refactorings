import OpenAI from 'openai';

import { handlers } from './handlers';

import { getTypeString } from './util/TypesUtil';

const openAIApiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: openAIApiKey,
  dangerouslyAllowBrowser: true
});

const MOCK = true;

export default class Refactorings {
  constructor(injector) {
    this._handlers = handlers.map(handler => {
      return injector.instantiate(handler);
    });
  }

  /**
   * Get the suggested refactoring for an element.
   *
   * @param {import('bpmn-js/lib/model/Types').Element} element
   *
   * @returns {Object|null}
   */
  async getSuggestedRefactoring(element) {
    const metaData = this._handlers.map(handler => {
      return handler.getMetaData();
    });

    const elementType = getTypeString(element.businessObject);

    const elementName = element.businessObject.name;

    const systemPrompt = getSystemPrompt(metaData);

    console.log('system prompt:', systemPrompt);

    const chatCompletion = MOCK
      ? getMockChatCompletion(elementType, elementName)
      : await openai.chat.completions.create({
        messages: [
          {
            'role': 'system',
            'content': systemPrompt
          },
          {
            'role': 'user',
            'content': `Can the following element be replaced by one of the patterns: ${ elementType } "${ elementName }"?`
          }
        ],
        model: 'gpt-4'
      });

    const { choices = [] } = chatCompletion;

    if (!choices.length) {
      return null;
    }

    const { message } = choices[ 0 ];

    const { content } = message;

    return content === 'NULL' ? null : JSON.parse(content);
  }

  refactor(element, refactoring) {
    const handler = this._handlers.find(handler => {
      return handler.getMetaData().id === refactoring.id;
    });

    if (!handler) {
      throw new Error(`No handler found for refactoring ${ refactoring.id }`);
    }

    return handler.refactor(element, refactoring);
  }

  preview(element, refactoring) {
    const handler = this._handlers.find(handler => {
      return handler.getMetaData().id === refactoring.id;
    });

    if (!handler) {
      throw new Error(`No handler found for refactoring ${ refactoring.id }`);
    }

    return handler.preview(element, refactoring);
  }
}

Refactorings.$inject = [ 'injector' ];

/**
 * Get the system prompt for the refactoring.
 *
 * @param {import('./handlers/Handler').MetaData[]} metaData
 *
 * @returns {string}
 */
function getSystemPrompt(metaData) {
  return `You are a BPMN expert. Your given a description of a BPMN task and
your task is to figure you whether this task could be replaced by one of the
following patterns:

${
  metaData.map((data, index) => {
    return `${ index + 1 }. ${ data.id }

${ data.description }`;
  }).join('\n\n')
}

If you can find an answer, reply with a JSON object that has all the required
properties. Your reply must ONLY be the JSON. If you can't find an answer reply,
with NULL.`;
}

function getMockChatCompletion(elementType, elementName) {
  let refactoring = null;

  if (elementType === 'Undefined Task' && elementName === 'Send Slack notification') {
    refactoring = {
      id: 'slack-outbound-connector'
    };
  } else if (elementType === 'User Task' && elementName === 'Send email to customer and wait for reply') {
    refactoring = {
      id: 'automate-send-and-wait',
      sendTaskName: 'Send email to customer',
      intermediateCatchEventName: 'Wait for reply'
    };
  }

  console.log('mock refactoring:', refactoring);

  return {
    choices: [
      {
        message: {
          content: JSON.stringify(refactoring)
        }
      }
    ]
  };
}