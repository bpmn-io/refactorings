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
import { typeToString } from '../open-ai/util';

import elementTemplateToolDescriptions from './elementTemplateToolDescriptions.json';

const SYSTEM_PROMPT = `As a seasoned BPMN expert specializing in enhancing BPMN
processes, my forte lies in optimizing workflows by strategically applying
connector templates to various elements. Each template I utilize serves a
specific purpose, either facilitating connections via a designated method like
REST or linking to a particular service or platform.

Your task is to provide me with the BPMN element along with its name, and I'll
discern the most suitable templates. It's imperative to carefully assess the
characteristics of each template before making a decision, ensuring seamless
refactoring.

Here are the guidelines to follow:

* If the element's name explicitly mentions a specific service compatible with one or more templates, prioritize those tools for consideration.
* Services may be abbreviated, so it's essential to recognize them even in their shortened forms.
* If the element's name implies the usage of HTTP or REST without specifying any particular service, consider these templates as fallback options.
* However, if there's a more suitable template available for the given scenario, refrain from suggesting HTTP or REST templates.
* HTTP and REST templates should not be used in conjunction with other templates.
* If an element's name doesn't suggest using any of the templates, simply return an empty object.
* If an element's name mentions a platform or service that doesn't have a corresponding template, create one and prefix it with __fallback.
* You output must be JSON!

Example output:

{ "templates": [ "template_Name_of_template_v1" ] }

Example output when no templates are applicable:

{ "templates": [ "__fallback-Name_of_template" ] }

Provide the BPMN element details, and I'll provide you with the optimal templates.`;

// TODO: use this to rank templates
function getRanking(elementTemplateId) {
  if ([
    'io.camunda.connectors.HttpJson.v2',
    'io.camunda.connectors.http.Polling.Boundary',
    'io.camunda.connectors.http.Polling',
    'io.camunda.connectors.GraphQL.v1',
    'io.camunda.connectors.webhook.WebhookConnectorBoundary.v1',
    'io.camunda.connectors.webhook.WebhookConnectorIntermediate.v1',
    'io.camunda.connectors.webhook.WebhookConnector.v1',
    'io.camunda.connectors.webhook.WebhookConnectorStartMessage.v1'
  ].includes(elementTemplateId)) {
    return 1;
  }

  return 2;
}

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

  getUserPrompt = (element) => {
    const tools = this.getTools(element);

    const elementType = typeToString(getBusinessObject(element));

    const elementName = getBusinessObject(element).get('name');

    return `The following connector templates are available:
      ${ tools.map(({ function: { description, name } }) => `name: ${ name}, description: ${ description }`).join('\n\n') }

      Select templates for the following element: ${ elementType } "${ elementName }"
    `;
  };

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