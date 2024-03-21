import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

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
      const elementTemplate = this._elementTemplates.get(id);

      if (!elementTemplate) {
        return false;
      }

      const { appliesTo } = elementTemplate;

      return isAnyExactly(element, appliesTo) && !isEmptyString(getBusinessObject(element).get('name'));
    }

    execute(element, args) {
      const elementTemplate = this._elementTemplates.get(id);

      if (!elementTemplate) {
        throw new Error(`element template with ID ${id} not found`);
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
  }

  ElementTemplateHandler.$inject = [
    'elementTemplates'
  ];

  return ElementTemplateHandler;
}