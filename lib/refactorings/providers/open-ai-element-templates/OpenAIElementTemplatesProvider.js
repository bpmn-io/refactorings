/**
 * @typedef {import('bpmn-js/lib/model/Types').Element} Element
 *
 * @typedef { {
 *   type: 'function';
 *   function: {
 *     arguments?: Object;
 *     description: string;
 *     name: string;
 *   };
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

import { isUndefined } from 'min-dash';

import {
  isAnyExactly,
  isEmptyString
} from '../open-ai/util';

import OpenAIProvider from '../open-ai/OpenAIProvider';

const SYSTEM_PROMPT = `As a BPMN expert, I streamline workflows focusing on
names or abbreviations of services. If a specific service is mentioned, I will
only consider tools for that service. I will use tools not specific to any
service (e.g. HTTP/REST, GraphQL, Webhooks) as a fallback, but only if the name
implies it. Name the element for tool selection.`;

export default class OpenAIElementTemplatesProvider extends OpenAIProvider {
  constructor(config = {}, elementTemplates, eventBus, refactorings) {
    super({
      ...config,
      openai: {
        systemPrompt: SYSTEM_PROMPT,
        ...config.openai
      }
    }, eventBus, refactorings);

    this._elementTemplates = elementTemplates;
    this._eventBus = eventBus;
  }

  /**
   * Get tools for applying element templates to the given element. Each tool
   * corresponds to one or many element templates. Fallback tool is included to
   * handle cases where no element template can be applied.
   *
   * @param {Element} element
   *
   * @returns {Tool[]}
   */
  _getTools(element) {
    if (isUndefined(getBusinessObject(element).get('name'))
      || isEmptyString(getBusinessObject(element).get('name'))) {
      return [];
    }

    const elementTemplates = this._elementTemplates.getLatest();

    const tools = elementTemplates
      .filter((elementTemplate) => {
        return this._canApplyElementTemplate(element, elementTemplate);
      })
      .map(({ description, id, metadata = {} }) => {
        const { keywords = [] } = metadata;

        return {
          type: 'function',
          function: {
            name: idToToolName(id),
            description: getFunctionDescription(description, keywords)
          }
        };
      });

    if (!tools.length) {
      return [];
    }

    return [ ...tools, this.getFallbackTool() ];
  }

  /**
   * Get refactorings for element and tool calls. Each refactoring corresponds
   * to one element template.
   *
   * @param {Element} _
   * @param {ToolCall[]} toolCalls
   *
   * @returns {Refactoring[]}
   */
  _getRefactorings(_, toolCalls) {
    let refactorings = toolCalls.reduce((refactorings, { name }) => {
      const id = toolNameToId(name);

      const refactoring = {
        id: `element-template-${ id }`,
        label: this._getLabel(id),
        execute: (elements) => {
          if (elements.length !== 1) {
            throw new Error(`expected one element, got ${ elements.length }`);
          }

          const element = elements[ 0 ];

          this._execute(element, id);
        }
      };

      return [
        ...refactorings,
        refactoring
      ];
    }, []);

    refactorings = removeDuplicateRefactorings(refactorings);

    refactorings = sortRefactoringsAlphabetically(refactorings);

    return refactorings;
  }

  _getLabel(elementTemplateId) {
    const elementTemplate = this._getElementTemplate(elementTemplateId);

    if (!elementTemplate) {
      throw new Error(`no element template with ID ${ elementTemplateId } found`);
    }

    return `Apply ${ elementTemplate.name } template`;
  }

  _execute(element, elementTemplateId) {
    const elementTemplate = this._getElementTemplate(elementTemplateId);

    if (!elementTemplate) {
      throw new Error(`no element template with ID ${ elementTemplateId } found`);
    }

    this._eventBus.fire('refactorings.execute', {
      refactoring: {
        type: 'element-template',
        elementTemplateId
      }
    });

    this._elementTemplates.applyTemplate(element, elementTemplate);
  }

  /**
   * Check whether element template can be applied to the given element.
   *
   * @param {Element} element
   * @param {string[]} appliesTo
   *
   * @returns {boolean}
   */
  _canApplyElementTemplate(element, elementTemplate) {
    const {
      appliesTo,
      category = {}
    } = elementTemplate;

    return isAnyExactly(element, appliesTo) && category.id === 'connectors';
  }

  _getElementTemplate(elementTemplateId) {
    const latestElementTemplates = this._elementTemplates.getLatest(elementTemplateId);

    if (!latestElementTemplates) {
      return null;
    }

    const [ latestElementTemplate ] = latestElementTemplates;

    if (!latestElementTemplate) {
      return null;
    }

    return latestElementTemplate;
  }
}

OpenAIElementTemplatesProvider.$inject = [
  'config.refactorings',
  'elementTemplates',
  'eventBus',
  'refactorings'
];

function removeDuplicateRefactorings(refactorings) {
  return refactorings.filter((refactoring, index) => {
    return refactorings.findIndex(otherRefactoring => otherRefactoring.id === refactoring.id) === index;
  });
}

function sortRefactoringsAlphabetically(refactorings) {
  return refactorings.slice().sort((refactoring, otherRefactoring) => refactoring.label.localeCompare(otherRefactoring.label));
}

export function idToToolName(id) {
  return id.replace(/\./g, '_');
}

export function toolNameToId(name) {
  return name.replace(/_/g, '.');
}

function getFunctionDescription(description, keywords = []) {
  if (keywords.length) {
    return `Description: ${ description }, Keywords: ${ keywords.map(keyword => `"${ keyword }"`).join(', ') }`;
  }

  return `Description: ${ description }`;
}