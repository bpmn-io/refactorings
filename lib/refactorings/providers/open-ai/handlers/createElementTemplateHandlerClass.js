import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import { isUndefined } from 'min-dash';

import {
  elementTemplateIdToToolName,
  isAnyExactly,
  isEmptyString
} from '../util';

export default function createElementTemplateHandlerClass(id, description) {
  class ElementTemplateHandler {
    constructor(elementTemplates) {
      this._elementTemplates = elementTemplates;
    }

    canExecute(element) {
      const elementTemplate = this._getElementTemplate();

      if (!elementTemplate) {
        return false;
      }

      const {
        appliesTo = [],
        deprecated
      } = elementTemplate;

      return !deprecated
        && isAnyExactly(element, appliesTo)
        && !isUndefined(getBusinessObject(element).get('name'))
        && !isEmptyString(getBusinessObject(element).get('name'));
    }

    execute(element, args) {
      const elementTemplate = this._getElementTemplate();

      if (!elementTemplate) {
        throw new Error(`no element template with ID ${id} found`);
      }

      this._elementTemplates.applyTemplate(element, elementTemplate);
    }

    /**
     * Get function description for OpenAI.
     *
     * @returns {Object}
     */
    getFunctionDescription() {
      return {
        name: elementTemplateIdToToolName(id),
        parameters: {
          'type': 'object',
          'properties': {},
          'required': []
        },
        description
      };
    }

    /**
     * Get label for refactoring.
     *
     * @returns {string}
     */
    getLabel() {
      const elementTemplate = this._getElementTemplate();

      if (!elementTemplate) {
        throw new Error(`no element template with ID ${id} found`);
      }

      return `Apply ${ elementTemplate.name } template`;
    }

    _getElementTemplate() {
      const latestElementTemplates = this._elementTemplates.getLatest(id);

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

  ElementTemplateHandler.$inject = [
    'elementTemplates'
  ];

  return ElementTemplateHandler;
}