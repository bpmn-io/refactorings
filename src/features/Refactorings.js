import OpenAI from 'openai';

import { handlers } from './handlers';

import { getTypeString } from './util/TypesUtil';

const openAIApiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: openAIApiKey,
  dangerouslyAllowBrowser: true
});

const systemPrompt = `You are a BPMN expert. Your given a description of a BPMN
task and your task is to figure out which tool to use to refactor it. What
refactoring action can be performed on the the element given by the user.`.split('\n').map(line => line.trim()).join(' ');

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
    const tools = this._handlers.map(handler => {
      return {
        type: 'function',
        function: handler.getFunctionDescription()
      };
    });

    const elementType = getTypeString(element.businessObject);

    const elementName = element.businessObject.name;

    const response = await openai.chat.completions.create({
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
    });

    console.log('response', response);

    const tool = getTool(response);

    console.log('tool', tool);

    if (!tool) {
      return null;
    }

    const handler = this._handlers.find(handler => {
      return handler.getFunctionDescription().name === tool.name;
    });

    if (!handler.validate(element, tool)) {
      console.log('refactoring not valid', tool);

      return null;
    }

    return tool;
  }

  refactor(element, refactoring) {
    const handler = this._handlers.find(handler => {
      return handler.getFunctionDescription().name === refactoring.name;
    });

    if (!handler) {
      throw new Error(`No handler found for refactoring ${ refactoring.id }`);
    }

    return handler.refactor(element, refactoring.arguments);
  }

  preview(element, refactoring) {
    const handler = this._handlers.find(handler => {
      return handler.getFunctionDescription().name === refactoring.name;
    });

    if (!handler) {
      throw new Error(`No handler found for refactoring ${ refactoring.id }`);
    }

    return handler.preview(element, refactoring.arguments);
  }
}

Refactorings.$inject = [ 'injector' ];

function getTool(response) {
  const toolCalls = response.choices[0]?.message?.tool_calls;

  if (!toolCalls) {
    return null;
  }

  const fn = toolCalls[ 0 ]?.function;

  if (!fn) {
    return null;
  }

  let { name, arguments: args } = fn;

  args = JSON.parse(args);

  return {
    name,
    arguments: args
  };
}