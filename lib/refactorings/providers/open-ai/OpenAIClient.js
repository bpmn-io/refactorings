import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { typeToString } from './util';

const DEFAULT_MODEL = 'gpt-3.5-turbo-1106';

const DEFAULT_TEMPERATURE = 0.1;

const DEFAULT_SEED = 42;

const systemPrompt = `You are a BPMN expert. Your strength lies in refactoring
BPMN processes to improve them. Given a BPMN element and its name, your task is
to decide which tools to use to refactor it. Carefully read the description of
each tool and then look at the given BPMN element. It's important to use the
right tools for refactoring. Each tool can only be used once. There are no
exceptions! Which tools could be used to refactor the following element?`.split('\n').map(line => line.trim()).join(' ');

export default class OpenAIClient {
  constructor(config = {}) {
    const {
      createChatCompletion,
      model = DEFAULT_MODEL,
      seed = DEFAULT_SEED,
      temperature = DEFAULT_TEMPERATURE
    } = config;

    this._createChatCompletion = createChatCompletion;
    this._model = model;
    this._seed = seed;
    this._temperature = temperature;
  }

  async getToolCalls(element, tools) {
    const elementType = typeToString(getBusinessObject(element));

    const elementName = getBusinessObject(element).get('name');

    const response = await this._createChatCompletion({
      messages: [
        {
          'role': 'system',
          'content': systemPrompt
        },
        {
          'role': 'user',
          'content': `${ elementType } "${ elementName }"?`
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
  }
}

function getMessage(response) {
  return response.choices[0]?.message?.content;
}

function getTools(response) {
  const toolCalls = response.choices[0]?.message?.tool_calls;

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