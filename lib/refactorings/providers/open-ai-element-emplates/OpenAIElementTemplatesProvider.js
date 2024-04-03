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
 */
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { isUndefined } from 'min-dash';

import {
  isAnyExactly,
  isEmptyString
} from '../open-ai/util';

import {
  elementTemplateIdToToolName,
  toolNameToElementTemplateId
} from './util';

import OpenAIProvider from '../open-ai/OpenAIProvider';

import elementTemplateToolDescriptions from './elementTemplateToolDescriptions.json';

const SYSTEM_PROMPT = `As a BPMN expert, I streamline workflows focusing on names, acronyms, abbreviations, and using HTTP/REST, GraphQL and Webhook as fallback.
Biased to matching by specific words or actions. Otherwise, if more than one tool matches, I will provide all sensible options. 
Name the element for tool selection.`;

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
   * corresponds to a specific element template. Fallback tool is included to
   * handle cases where no element template can be applied.
   *
   * @param {Element} element
   *
   * @returns {Tool[]}
   */
  getTools(element) {
    const tools = Object.entries(elementTemplateToolDescriptions)
      .filter(([ elementTemplateId, _ ]) => {
        return !isUndefined(getBusinessObject(element).get('name'))
          && !isEmptyString(getBusinessObject(element).get('name'))
          && this._canApplyElementTemplate(element, elementTemplateId);
      })
      .map(([ elementTemplateId, toolDescription ]) => {
        return {
          type: 'function',
          function: {
            name: elementTemplateIdToToolName(elementTemplateId),
            description: toolDescription
          }
        };
      });

    if (!tools.length) {
      return [];
    }

    return [ ...tools, this.getFallbackTool() ];
  }

  getLabel(element, toolCall) {
    const elementTemplateId = toolNameToElementTemplateId(toolCall.name);

    const elementTemplate = this._getElementTemplate(elementTemplateId);

    if (!elementTemplate) {
      throw new Error(`no element template with ID ${ elementTemplateId } found`);
    }

    return `Apply ${ elementTemplate.name } template`;
  }

  execute(element, toolCall) {
    const elementTemplateId = toolNameToElementTemplateId(toolCall.name);

    const elementTemplate = this._getElementTemplate(elementTemplateId);

    if (!elementTemplate) {
      throw new Error(`no element template with ID ${ elementTemplateId } found`);
    }

    this._elementTemplates.applyTemplate(element, elementTemplate);
  }

  _canApplyElementTemplate(element, elementTemplateId) {
    const elementTemplate = this._getElementTemplate(elementTemplateId);

    if (!elementTemplate) {
      return false;
    }

    const {
      appliesTo = [],
      deprecated
    } = elementTemplate;

    return !deprecated && isAnyExactly(element, appliesTo);
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