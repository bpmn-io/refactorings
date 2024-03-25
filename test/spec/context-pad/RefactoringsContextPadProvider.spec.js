import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import {
  act,
  waitFor
} from '@testing-library/preact';

import {
  query as domQuery,
} from 'min-dom';

import { BpmnImprovedCanvasModule } from '@camunda/improved-canvas';
import { CloudElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import RefactoringsContextPadModule from '../../../lib/context-pad/';
import refactoringsModule from '../../../lib/refactorings';

import diagramXML from '../../fixtures/bpmn/simple.bpmn';


describe('Context Pad', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      BpmnImprovedCanvasModule,
      RefactoringsContextPadModule,
      refactoringsModule,
      CloudElementTemplatesCoreModule
    ]
  }));


  it('should add entry', inject(function(elementRegistry, contextPad) {

    // given
    const task = elementRegistry.get('Task_1');

    // when
    contextPad.open(task);

    // then
    expect(domQuery('.entry.suggest-refactoring')).to.exist;
  }));


  it('should show refactoring icon', inject(function(elementRegistry, contextPad) {

    // given
    const task = elementRegistry.get('Task_1');

    // when
    contextPad.open(task);

    // then
    expect(domQuery('.entry.suggest-refactoring')).to.exist;
  }));


  it('should pre-fetch results in popup menu provider', inject(function(elementRegistry, contextPad, refactorings) {

    // given
    const task = elementRegistry.get('Task_1');
    refactorings.getRefactorings = sinon.spy();

    // when
    contextPad.open(task);

    // then
    expect(refactorings.getRefactorings).to.have.been.calledWith([ task ]);

  }));


  it('should open popup menu on click', inject(async function(elementRegistry, contextPad, popupMenu) {

    // given
    const task = elementRegistry.get('Task_1');
    popupMenu.open = sinon.spy();

    contextPad.open(task);

    const icon = domQuery('.entry.suggest-refactoring');

    // when
    await act(() => icon.click());

    // then
    waitFor(() => {
      expect(popupMenu.open).to.have.been.called;
    });

  }));

});