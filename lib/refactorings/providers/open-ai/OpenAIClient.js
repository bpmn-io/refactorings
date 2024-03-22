import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { typeToString } from './util';

const DEFAULT_MODEL = 'gpt-3.5-turbo-0125';

const systemPrompt = `You are a BPMN expert. Your given a description of a BPMN
task and your task is to figure out which tool to use to refactor it. What
refactoring action can be performed on the the element given by the user.`.split('\n').map(line => line.trim()).join(' ');

export default class OpenAIClient {
  constructor(openai, options = {}) {
    this._openai = openai;

    this._model = options.model || DEFAULT_MODEL;
  }

  async getToolCalls(element, tools) {
    const elementType = typeToString(getBusinessObject(element));

    const elementName = getBusinessObject(element).get('name');

    console.log('args', JSON.stringify({
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
      model: 'gpt-4-1106-preview',
      tool_choice: 'auto',
      tools
    }, null, 2));

    console.log('openai', this._openai);

    const response = await this._openai.chat.completions.create({
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

    console.log('response', response);

    return getTools(response);
  }
}

function getTools(response) {
  const toolCalls = response.choices[0]?.message?.tool_calls;

  if (!toolCalls) {
    return [];
  }

  console.log('toolCalls raw', JSON.stringify(toolCalls, null, 2));

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