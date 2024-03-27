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

const SYSTEM_PROMPT = `As a seasoned BPMN expert specializing in enhancing BPMN processes, my forte lies in optimizing workflows by strategically applying connector templates to various elements. Each tool I utilize serves a specific purpose, either facilitating connections via a designated method like REST or linking to a particular service such as Slack.

Your task is to provide me with the BPMN element along with its name, and I'll discern the most suitable tool for applying the necessary template. It's imperative to carefully assess the characteristics of each tool before making a decision, ensuring seamless refactoring.

Here are the guidelines to follow:

* If the element's name explicitly mentions a specific service compatible with one or more tools, prioritize those tools for consideration.
* Services may be abbreviated, so it's essential to recognize them even in their shortened forms.
* If the element's name implies the usage of HTTP or REST without specifying any particular service, consider these tools as fallback options.
* However, if there's a more suitable tool available for the given scenario, refrain from suggesting HTTP or REST tools.
* HTTP and REST tools should not be used in conjunction with other tools.
* Never explain the rationale behind selecting a particular tool; focus solely on identifying the most appropriate one.

Provide the BPMN element details, and I'll provide you with the optimal tools for applying the template.`;

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

  getTools(element) {
    return Object.entries(elementTemplateToolDescriptions)
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