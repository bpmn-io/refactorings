/**
 * @typedef {import('bpmn-js/lib/model/Types').Element} Element
 *
 * @typedef { {
 *   type: 'function';
 *   function: {
 *     arguments?: Object;
 *     description: string;
 *     name: string;
 *   }
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

export const FALLBACK_TOOL_NAME = 'fallback_tool';

export default class OpenAIProvider {
  constructor(config = {}, eventBus, refactorings) {
    refactorings.registerProvider(this);

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

      const cached = this._cache[ businessObject.get('id') ];

      if (cached && cached.name !== businessObject.get('name')) {
        delete this._cache[ businessObject.get('id') ];
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

  /**
   * Get tools for given element. Must be implemented by provider.
   *
   * @param {Element} element
   * @param {Tool[]} tools
   *
   * @returns {Array<Function>}
   */
  _getTools(element, tools) {
    throw new Error('must implement');
  }

  /**
   * Get refactorings for given element and tool calls. Must be implemented by
   * provider.
   *
   * @param {Element} element
   * @param {ToolCall[]} toolCalls
   *
   * @returns {Refactoring[]}
   */
  _getRefactorings(element, toolCalls) {
    throw new Error('must implement');
  }

  _getCached(element) {
    return this._cache[ element.id ] && this._cache[ element.id ].request;
  }

  _setCached(element, request) {
    const businessObject = getBusinessObject(element);

    this._cache[ businessObject.get('id') ] = {
      name: getBusinessObject(element).get('name'),
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
      return cached;
    }

    const request = this._openAIClient.getToolCalls(element, tools);

    this._setCached(element, request);

    return request;
  }

  /**
   * Get a fallback tool that can be used if the element's name doesn't provide
   * any clear indication. OpenAI's function calling feature is heavily biased
   * towards choosing one of the tools provided, even none of them are suitable.
   *
   * @returns {Tool}
   */
  getFallbackTool() {
    return {
      type: 'function',
      function: {
        name: FALLBACK_TOOL_NAME,
        description: `Fallback tool to be used _only_ if element's name:
- Indicates no existing tool
- Indicates tool that doesn't exist (e.g. Reddit mentioned but no Reddit tool exists)
- Incomplete phrase or sentence
- Single characters or digits
- Random sequences of characters
- Inaproppriate in any other way`
      }
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

    const tools = this._getTools(element);

    this._debug && console.log('tools', tools);

    if (!tools.length) {
      return [];
    }

    let toolCalls = await this._getToolCalls(element, tools);

    this._debug && console.log('tool calls', toolCalls);

    toolCalls = toolCalls.filter((toolCall) => toolCall.name !== FALLBACK_TOOL_NAME);

    const refactorings = this._getRefactorings(element, toolCalls);

    this._debug && console.log('refactorings', refactorings);

    return refactorings;
  }
}

OpenAIProvider.$inject = [
  'config.refactorings',
  'eventBus',
  'refactorings'
];