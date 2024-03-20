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

    this._openAIClient = new OpenAIClient(config);
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

    console.log('toolCalls', toolCalls);

    return toolCalls.map(toolCall => {
      return {
        id: toolCall.name,
        label: toolCall.name,
        execute: () => {
          console.log('execute', toolCall);
        }
      };
    });
  }
}

OpenAIProvider.$inject = [ 'config.openai', 'injector', 'refactorings' ];

