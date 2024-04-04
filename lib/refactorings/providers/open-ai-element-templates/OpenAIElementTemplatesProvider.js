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

import { isUndefined } from 'min-dash';

import {
  isAnyExactly,
  isEmptyString
} from '../open-ai/util';

import OpenAIProvider from '../open-ai/OpenAIProvider';

import elementTemplateToolDescriptions from './elementTemplateToolDescriptions.json';

const SYSTEM_PROMPT = `As a BPMN expert, I streamline workflows focusing on
names or abbreviations of services. If a specific service is mentioned, I will
only consider tools for that service. I will use HTTP/REST, GraphQL and Webhook
as fallback, but only if the name implies it. Name the element for tool
selection.`;

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
    const tools = Object.entries(elementTemplateToolDescriptions)
      .filter(([ _, { appliesTo, elementTemplates } ]) => {
        return !isUndefined(getBusinessObject(element).get('name'))
          && !isEmptyString(getBusinessObject(element).get('name'))
          && this._canApplyElementTemplates(element, appliesTo, elementTemplates);
      })
      .map(([ toolName, { description } ]) => {
        return {
          type: 'function',
          function: {
            name: toolName,
            description: description
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

      const toolDescription = elementTemplateToolDescriptions[ name ];

      if (!toolDescription) {
        console.error(`no tool description found for ${ name }`);

        return refactorings;
      }

      const { elementTemplates } = toolDescription;

      const refactoringsForToolCall = elementTemplates.map(elementTemplateId => {
        return {
          id: `element-template-${ elementTemplateId }`,
          label: this._getLabel(elementTemplateId),
          execute: (elements) => {
            if (elements.length !== 1) {
              throw new Error(`expected one element, got ${ elements.length }`);
            }

            const element = elements[ 0 ];

            this._execute(element, elementTemplateId);
          }
        };
      });

      return [
        ...refactorings,
        ...refactoringsForToolCall
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

    this._elementTemplates.applyTemplate(element, elementTemplate);
  }

  /**
   * Check whether element templates can be applied to the given element.
   * Element templates can be applied if the element matches any of the
   * specified types and all specified element templates are available.
   *
   * @param {Element} element
   * @param {string[]} appliesTo
   * @param {string[]} elementTemplates
   *
   * @returns {boolean}
   */
  _canApplyElementTemplates(element, appliesTo, elementTemplates) {
    if (!isAnyExactly(element, appliesTo)) {
      return false;
    }

    return elementTemplates.every(elementTemplateId => {
      const elementTemplate = this._getElementTemplate(elementTemplateId);

      return !isUndefined(elementTemplate);
    });
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