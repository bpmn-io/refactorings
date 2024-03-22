import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { typeToString } from './util';

const DEFAULT_MODEL = 'gpt-3.5-turbo-1106';

const systemPrompt = `You are a BPMN expert. Your given a description of a BPMN
task and your task is to figure out which tool to use to refactor it. What
refactoring action can be performed on the the element given by the user.`.split('\n').map(line => line.trim()).join(' ');

export default class OpenAIClient {
  constructor(config = {}) {
    const {
      createChatCompletion,
      model = DEFAULT_MODEL
    } = config;

    this._createChatCompletion = createChatCompletion;
    this._model = model;
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
      tool_choice: 'auto',
      tools
    });

    return getTools(response);
  }
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