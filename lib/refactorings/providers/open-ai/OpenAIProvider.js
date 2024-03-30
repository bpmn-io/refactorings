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

export default class OpenAIProvider {
  constructor(config = {}, eventBus, refactorings) {
    refactorings.registerProvider(this);

    const { openai } = config;

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
   * @returns {Array<Function>}
   */
  getTools() {
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
  _getToolCalls(element, tools, userPrompt) {
    const cached = this._getCached(element);

    if (cached) {
      return cached;
    }

    const request = this._openAIClient.getToolCalls(element, tools, userPrompt);

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

    const tools = this.getTools(element);

    if (!tools.length) {
      return [];
    }

    const toolCalls = await this._getToolCalls(element, tools, this.getUserPrompt(element));

    return toolCalls.reduce((refactorings, toolCall) => {
      return [
        ...refactorings,
        {
          id: toolCall.name,
          label: this.getLabel(element, toolCall),
          execute: (elements) => {
            if (elements.length !== 1) {
              throw new Error(`expected one element, got ${ elements.length }`);
            }

            const element = elements[ 0 ];

            this.execute(element, toolCall);
          }
        }
      ];
    }, []);
  }
}

OpenAIProvider.$inject = [
  'config.refactorings',
  'eventBus',
  'refactorings'
];