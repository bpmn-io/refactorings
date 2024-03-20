import TestContainer from 'mocha-test-container-support';

import {
  clearBpmnJS,
  setBpmnJS,
  insertCoreStyles,
  insertBpmnStyles,
  enableLogging
} from 'test/TestHelper.js';

import Modeler from 'bpmn-js/lib/Modeler.js';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule,
  ZeebeTooltipProvider
} from 'bpmn-js-properties-panel';

import { CreateAppendAnythingModule } from 'bpmn-js-create-append-anything';

import ZeebeBehaviorsModule from 'camunda-bpmn-js-behaviors/lib/camunda-cloud/index.js';

import ZeebeModdle from 'zeebe-bpmn-moddle/resources/zeebe.json';

import {
  CloudElementTemplatesPropertiesProviderModule
} from 'bpmn-js-element-templates';

import { BpmnImprovedCanvasModule } from '@camunda/improved-canvas';

import ElementTemplateIconRenderer from '@bpmn-io/element-template-icon-renderer';

import Refactorings from 'lib/index.js';

import elementTemplates from '../fixtures/element-templates/all.json';

import OpenAI from 'openai';

import diagramXml from 'test/fixtures/bpmn/simple.bpmn';

const openAIApiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: openAIApiKey,
  dangerouslyAllowBrowser: true
});

const singleStart = window.__env__ && window.__env__.SINGLE_START === 'true';

await insertCoreStyles();
await insertBpmnStyles();

describe('<Example>', function() {

  let modelerContainer;

  let propertiesContainer;

  let container;

  beforeEach(function() {
    modelerContainer = document.createElement('div');
    modelerContainer.classList.add('modeler-container');

    propertiesContainer = document.createElement('div');
    propertiesContainer.classList.add('properties-container');

    container = TestContainer.get(this);

    container.appendChild(modelerContainer);
    container.appendChild(propertiesContainer);
  });

  async function createModeler(xml, options = {}, BpmnJS = Modeler) {
    const {
      shouldImport = true,
      layout = {}
    } = options;

    clearBpmnJS();

    const modeler = new BpmnJS({
      container: modelerContainer,
      keyboard: {
        bindTo: document
      },
      additionalModules: [
        ZeebeBehaviorsModule,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        ZeebePropertiesProviderModule,
        CloudElementTemplatesPropertiesProviderModule,
        CreateAppendAnythingModule,
        BpmnImprovedCanvasModule,
        ElementTemplateIconRenderer,
        Refactorings
      ],
      moddleExtensions: {
        zeebe: ZeebeModdle
      },
      propertiesPanel: {
        parent: propertiesContainer,
        feelTooltipContainer: container,
        description: ZeebeTooltipProvider,
        layout
      },
      refactorings: {
        openai
      },
      elementTemplates,
      ...options
    });

    enableLogging && enableLogging(modeler, !!singleStart);

    setBpmnJS(modeler);

    if (!shouldImport) {
      return { modeler };
    }

    try {
      const result = await modeler.importXML(xml);

      return { error: null, warnings: result.warnings, modeler: modeler };
    } catch (err) {
      return { error: err, warnings: err.warnings, modeler: modeler };
    }
  }


  (singleStart ? it.only : it)('should render', async function() {

    // given
    // when
    const result = await createModeler(diagramXml);

    // then
    expect(result.error).not.to.exist;
  });

});
