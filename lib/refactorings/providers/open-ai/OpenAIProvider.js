/**
 * @type {import('bpmn-js/lib/model/Types').Element} Element
 *
 * @type {{
 *   id: string;
 *   label: string;
 *   execute: (elements: Element[]) => void;
 * }} Refactoring
 */
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import OpenAIClient from './OpenAIClient';

import handlers from './handlers';

export default class OpenAIProvider {
  constructor(config = {}, eventBus, injector, refactorings) {
    refactorings.registerProvider(this);

    this._handlers = handlers.map(Handler => {
      return injector.instantiate(Handler);
    });

    const { openai } = config;

    this._openAIClient = new OpenAIClient(openai);

    this._cache = {};

    eventBus.on('element.changed', ({ element }) => {
      const businessObject = getBusinessObject(element);

      for (const id in this._cache) {
        if (id === businessObject.get('id')
          && this._cache[ id ].name !== businessObject.get('name')) {
          delete this._cache[ id ];
        }
      }
    });

    eventBus.on('element.updateId', ({
      element: element,
      newId: newId
    }) => {
      const businessObject = getBusinessObject(element);

      if (this._cache[ businessObject.get('id') ]) {
        this._cache[ newId ] = this._cache[ businessObject.get('id') ];

        delete this._cache[ element.id ];
      }
    });

    eventBus.on([ 'shape.removed', 'connection.removed' ], ({ element }) => {
      const businessObject = getBusinessObject(element);

      delete this._cache[ businessObject.get('id') ];
    });
  }

  _getCached(element) {
    return this._cache[ element.id ] && this._cache[ element.id ].refactorings;
  }

  _setCached(element, refactorings) {
    const businessObject = getBusinessObject(element);

    this._cache[ businessObject.get('id') ] = {
      name: businessObject.get('name'),
      refactorings
    };
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

    const cached = this._getCached(element);

    if (cached) {
      return cached;
    }

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

    const refactorings = toolCalls.map(toolCall => {
      const handler = this._handlers.find(handler => {
        return handler.getFunctionDescription().name === toolCall.name;
      });

      if (!handler) {
        throw new Error(`no handler found for ${ toolCall.name }`);
      }

      return {
        id: toolCall.name,
        label: handler.getLabel(element, toolCall.arguments),
        execute: (elements) => {
          if (elements.length !== 1) {
            throw new Error(`expected one element, got ${ elements.length }`);
          }

          const element = elements[ 0 ];

          handler.execute(element, toolCall.arguments);
        }
      };
    });

    this._setCached(element, refactorings);

    return refactorings;
  }
}

OpenAIProvider.$inject = [
  'config.refactorings',
  'eventBus',
  'injector',
  'refactorings'
];

