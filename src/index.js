import Modeler from 'bpmn-js/lib/Modeler';

import CliModule from 'bpmn-js-cli';

import { CreateAppendAnythingModule } from 'bpmn-js-create-append-anything';

import ElementTemplateChooserModule from '@bpmn-io/element-template-chooser';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  ZeebePropertiesProviderModule,
} from 'bpmn-js-properties-panel';

import {
  CloudElementTemplatesPropertiesProviderModule
} from 'bpmn-js-element-templates';

import ElementTemplateIconRenderer from '@bpmn-io/element-template-icon-renderer';

import zeebeModdlePackage from 'zeebe-bpmn-moddle/resources/zeebe';

import FeaturesModule from './features';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js-properties-panel/dist/assets/properties-panel.css';
import 'bpmn-js-properties-panel/dist/assets/element-templates.css';
import '@bpmn-io/element-template-chooser/dist/element-template-chooser.css';

import './styles.scss';

import diagram from './diagram.bpmn';

import SlackOutboundTemplate from './features/templates/slack-outbound.json';

const container = document.getElementById('container');

const modeler = new Modeler({
  container,
  propertiesPanel: {
    parent: '#properties'
  },
  additionalModules: [
    FeaturesModule,
    CliModule,
    CreateAppendAnythingModule,
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    ZeebePropertiesProviderModule,
    CloudElementTemplatesPropertiesProviderModule,
    ElementTemplateIconRenderer,
    ElementTemplateChooserModule,
  ],
  keyboard: {
    bindTo: document,
  },
  moddleExtensions: {
    zeebe: zeebeModdlePackage,
  },
  elementTemplates: [
    SlackOutboundTemplate
  ]
});

modeler
  .importXML(diagram)
  .then(({ warnings }) => {
    if (warnings.length) {
      console.log(warnings);
    }

    const canvas = modeler.get('canvas');

    canvas.zoom('fit-viewport');
  })
  .catch((err) => {
    console.log(err);
  });

modeler.on('elements.changed', async () => {
  const { xml } = await modeler.saveXML({ format: true });

  console.log(xml);
});
