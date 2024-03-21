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
      console.log(`checking if can execute ElementTemplateHandler for ID ${ id }`);

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

    _getElementTemplate() {
      const latestElementTemplates = this._elementTemplates.getLatest(id);

      if (!latestElementTemplates) {
        console.log(`no latest element templates with ID ${id} found`);

        return null;
      }

      const [ latestElementTemplate ] = latestElementTemplates;

      if (!latestElementTemplate) {
        console.log(`no latest element template with ID ${id} found`);

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