/**
 * @type {import('bpmn-js/lib/model/Types').Element} Element
 *
 * @type {{
 *   id: string;
 *   label: string;
 *   execute: (elements: Element[]) => void;
 * }} Refactoring
 */

import OpenAIClient from './OpenAIClient';

import handlers from './handlers';

export default class OpenAIProvider {
  constructor(config = {}, injector, refactorings) {
    refactorings.registerProvider(this);

    this._handlers = handlers.map(Handler => {
      return injector.instantiate(Handler);
    });

    const { openai } = config;

    this._openAIClient = new OpenAIClient(openai);
  }

  /**
   * @param {Element[]} elements
   *
   * @returns {Refactoring[]}
   */
  async getRefactorings(elements) {

    // TODO: support more than one element
    if (elements.length !== 1) {
      return [];
    }

    const element = elements[ 0 ];

    const tools = this._handlers
      .filter(handler => handler.canExecute(element))
      .map(handler => {
        return {
          type: 'function',
          function: handler.getFunctionDescription()
        };
      });

    if (!tools.length) {
      return [];
    }

    const toolCalls = await this._openAIClient.getToolCalls(element, tools);

    return toolCalls.map(toolCall => {
      return {
        id: toolCall.name,
        label: toolCall.name,
        execute: (elements) => {
          if (elements.length !== 1) {
            throw new Error(`expected one element, got ${ elements.length }`);
          }

          const element = elements[ 0 ];

          const handler = this._handlers.find(handler => {
            return handler.getFunctionDescription().name === toolCall.name;
          });

          if (!handler) {
            throw new Error(`no handler found for ${ toolCall.name }`);
          }

          handler.execute(element, toolCall.arguments);
        }
      };
    });
  }
}

OpenAIProvider.$inject = [ 'config.refactorings', 'injector', 'refactorings' ];

