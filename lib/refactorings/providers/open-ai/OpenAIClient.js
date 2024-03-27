/**
 * @typedef {import('bpmn-js/lib/model/Types').Element} Element
 */

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { typeToString } from './util';

export const DEFAULT_MODEL = 'gpt-3.5-turbo-1106';

export const DEFAULT_TEMPERATURE = 0.1;

export const DEFAULT_SEED = 42;

export const DEFAULT_GET_USER_PROMPT = element => {
  const elementType = typeToString(getBusinessObject(element));

  const elementName = getBusinessObject(element).get('name');

  return `${ elementType } "${ elementName }"`;
};

export const DEFAULT_SYSTEM_PROMPT = `Which tool can be used to refactor the
following element?`;

/**
 * OpenAI client.
 *
 * @param { {
 *   createChatCompletion: (config: Object) => Promise<Object>;
 *   getUserPrompt: (element: Element) => string;
 *   model: string;
 *   seed: number;
 *   systemPrompt: string;
 *   temperature: number;
 * } } config
 */
export default class OpenAIClient {
  constructor(config = {}) {
    const {
      createChatCompletion = null,
      getUserPrompt = DEFAULT_GET_USER_PROMPT,
      model = DEFAULT_MODEL,
      seed = DEFAULT_SEED,
      systemPrompt = DEFAULT_SYSTEM_PROMPT,
      temperature = DEFAULT_TEMPERATURE
    } = config;

    if (!createChatCompletion) {
      throw new Error('createChatCompletion is required');
    }

    this._createChatCompletion = createChatCompletion;
    this._getUserPrompt = getUserPrompt;
    this._model = model;
    this._seed = seed;
    this._systemPrompt = systemPrompt;
    this._temperature = temperature;
  }

  async getToolCalls(element, tools) {
    try {
      const response = await this._createChatCompletion({
        messages: [
          {
            'role': 'system',
            'content': this._systemPrompt
          },
          {
            'role': 'user',
            'content': this._getUserPrompt(element)
          }
        ],
        model: this._model,
        seed: this._seed,
        temperature: this._temperature,
        tool_choice: 'auto',
        tools
      });

      const message = getMessage(response);

      if (message) {
        console.log('OpenAI response message:', message);
      }

      return getTools(response);
    } catch (error) {
      console.error('OpenAI error:', error);

      return [];
    }
  }
}

function getMessage(response) {
  return response?.choices[0]?.message?.content;
}

function getTools(response) {
  const toolCalls = response?.choices[0]?.message?.tool_calls;

  if (!toolCalls) {
    return [];
  }

  return toolCalls
    .filter(toolCall => toolCall.function)
    .map(toolCall => {
      let { name, arguments: args } = toolCall.function;

      args = JSON.parse(args);

      return {
        name,
        arguments: args
      };
    });
}