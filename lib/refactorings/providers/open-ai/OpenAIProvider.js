/**
 * @typedef {import('bpmn-js/lib/model/Types').Element} Element
 *
 * @typedef { {
 *   type: 'function';
 *   function: Object;
 * } } Tool
 *
 * @typedef { {
 *   name: string;
 *   arguments: Object;
 * } } ToolCall
 *
 * @typedef { {
 *   id: string;
 *   label: string;
 *   execute: (elements: Element[]) => void;
 * } } Refactoring
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

    const {
      debug = false,
      openai
    } = config;

    this._debug = debug;

    if (!openai) {
      console.warn('OpenAI not configured');
    }

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
    return this._cache[ element.id ] && this._cache[ element.id ].request;
  }

  _setCached(element, request) {
    const businessObject = getBusinessObject(element);

    this._cache[ businessObject.get('id') ] = {
      name: businessObject.get('name'),
      request
    };
  }

  /**
   * Get tool calls for element with given name. Caches request and returns
   * cached request if possible.
   *
   * @param {Element} element
   * @param {Tool[]} tools
   *
   * @returns {Promise<ToolCall[]>}
   */
  _getToolCalls(element, tools) {
    const cached = this._getCached(element);

    if (cached) {
      this._debug && console.log('[OpenAIProvider#_getToolCalls] found cached, returning cached');

      return cached;
    }

    const request = this._openAIClient.getToolCalls(element, tools);

    this._debug && console.log('[OpenAIProvider#_getToolCalls] no cached found');

    this._setCached(element, request);

    return request;
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

    this._debug && console.log('[OpenAIProvider#getRefactorings] tools that can execute:', tools.map(tool => tool.function.name));

    if (!tools.length) {
      return [];
    }

    const toolCalls = await this._getToolCalls(element, tools);

    this._debug && console.log('[OpenAIProvider#getRefactorings] tool calls:', toolCalls.map(toolCall => toolCall.name));

    return toolCalls.reduce((refactorings, toolCall) => {
      const handler = this._handlers.find(handler => {
        return handler.getFunctionDescription().name === toolCall.name;
      });

      if (!handler) {
        console.warn(`no handler found for ${ toolCall.name }`);

        return refactorings;
      }

      return [
        ...refactorings,
        {
          id: toolCall.name,
          label: handler.getLabel(element, toolCall.arguments),
          execute: (elements) => {
            if (elements.length !== 1) {
              throw new Error(`expected one element, got ${ elements.length }`);
            }

            const element = elements[ 0 ];

            handler.execute(element, toolCall.arguments);
          }
        }
      ];
    }, []);
  }
}

OpenAIProvider.$inject = [
  'config.refactorings',
  'eventBus',
  'injector',
  'refactorings'
];