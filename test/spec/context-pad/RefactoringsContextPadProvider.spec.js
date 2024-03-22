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

import RefactoringsContextPadModule from '../../../lib/context-pad/';
import MockPopupMenuModule from './MockPopupMenuProvider';

import diagramXML from '../../fixtures/bpmn/simple.bpmn';


describe('Context Pad', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      BpmnImprovedCanvasModule,
      RefactoringsContextPadModule,
      MockPopupMenuModule
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


  it('should pre-fetch results in popup menu provider', inject(function(elementRegistry, contextPad, refactoringsPopupMenuProvider) {

    // given
    const task = elementRegistry.get('Task_1');
    refactoringsPopupMenuProvider.fetchRefactoringActions = sinon.spy();

    // when
    contextPad.open(task);

    // then
    expect(refactoringsPopupMenuProvider.fetchRefactoringActions).to.have.been.calledWith(task);

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