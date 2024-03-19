import { handlers } from './handlers/index.js';

import { getTypeString } from './util/TypesUtil.js';

const systemPrompt = `You are a BPMN expert. Your given a description of a BPMN
task and your task is to figure out which tool to use to refactor it. What
refactoring action can be performed on the the element given by the user.`.split('\n').map(line => line.trim()).join(' ');

export default class Refactorings {
  constructor(injector, config = {}) {
    this._handlers = handlers.map(handler => {
      return injector.instantiate(handler);
    });

    this._openai = config.openai;
  }

  /**
   * Get the suggested refactoring for an element.
   *
   * @param {import('bpmn-js/lib/model/Types').Element} element
   *
   * @returns {Object|null}
   */
  async getSuggestedRefactoring(element) {
    const openai = this._openai;

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

    return handler.execute(element, refactoring.arguments);
  }
}

Refactorings.$inject = [ 'injector', 'config.refactorings' ];

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