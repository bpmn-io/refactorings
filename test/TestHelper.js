import {
  bootstrapBpmnJS,
  getBpmnJS,
  insertCSS
} from 'bpmn-js/test/helper/index.js';

import fileDrop from 'file-drops';

import download from 'downloadjs';

import Modeler from 'bpmn-js/lib/Modeler.js';


let PROPERTIES_PANEL_CONTAINER;

export * from 'bpmn-js/test/helper/index.js';

export function clearPropertiesPanelContainer() {
  if (PROPERTIES_PANEL_CONTAINER) {
    PROPERTIES_PANEL_CONTAINER.remove();
  }
}

export async function insertCoreStyles() {
  insertCSS(
    'properties-panel.css',
    (await import('@bpmn-io/properties-panel/dist/assets/properties-panel.css')).default
  );

  insertCSS(
    'element-templates.css',
    (await import('bpmn-js-element-templates/dist/assets/element-templates.css')).default
  );

  insertCSS(
    'test.css',
    (await import('./test.css')).default
  );
}

export async function insertBpmnStyles() {
  insertCSS(
    'diagram.css',
    (await import('bpmn-js/dist/assets/diagram-js.css')).default
  );

  insertCSS(
    'bpmn-js.css',
    (await import('bpmn-js/dist/assets/bpmn-js.css')).default
  );

  insertCSS(
    'bpmn-font.css',
    (await import('bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css')).default
  );
}

export function bootstrapModeler(diagram, options, locals) {
  return bootstrapBpmnJS(Modeler, diagram, options, locals);
}

// be able to load files into running bpmn-js test cases
document.documentElement.addEventListener('dragover', fileDrop('Drop a BPMN diagram to open it in the currently active test.', function(files) {
  const bpmnJS = getBpmnJS();

  if (bpmnJS && files.length === 1) {
    bpmnJS.importXML(files[0].contents);
  }
}));

insertCSS('file-drops.css', `
  .drop-overlay .box {
    background: orange;
    border-radius: 3px;
    display: inline-block;
    font-family: sans-serif;
    padding: 4px 10px;
    position: fixed;
    top: 30px;
    left: 50%;
    transform: translateX(-50%);
  }
`);

// be able to download diagrams using CTRL/CMD+S
document.addEventListener('keydown', function(event) {
  const bpmnJS = getBpmnJS();

  if (!bpmnJS) {
    return;
  }

  if (!(event.ctrlKey || event.metaKey) || event.code !== 'KeyS') {
    return;
  }

  event.preventDefault();

  bpmnJS.saveXML({ format: true }).then(function(result) {
    download(result.xml, 'test.bpmn', 'application/xml');
  });
});