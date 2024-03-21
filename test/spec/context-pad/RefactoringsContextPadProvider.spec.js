import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import {
  act,
  waitFor
} from '@testing-library/preact';

import { BpmnImprovedCanvasModule } from '@camunda/improved-canvas';

import diagramXML from '../../fixtures/bpmn/simple.bpmn';
import RefactoringsContextPadProvider from '../../../lib/context-pad/';
import MockPopupMenuProvider from './MockPopupMenuProvider';
import {
  query as domQuery,
  queryAll as domQueryAll
} from 'min-dom';

describe.only('Context Pad', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      BpmnImprovedCanvasModule,
      RefactoringsContextPadProvider,
      MockPopupMenuProvider
    ]
  }));


  it('should add entry', inject(function(elementRegistry, contextPad) {

    // given
    const task = elementRegistry.get('Task_1');

    // when
    contextPad.open(task);

    // then
    expect(domQuery('#refactoring-action-placeholder')).to.exist;
  }));


  it('should show refactoring icon', inject(function(elementRegistry, contextPad) {

    // given
    const task = elementRegistry.get('Task_1');

    // when
    contextPad.open(task);

    // then
    expect(domQuery('#refactoring-action-placeholder .refactoring-icon')).to.exist;
  }));


  it('should show loading spinner on click', inject(async function(elementRegistry, contextPad, refactoringsPopupMenuProvider) {

    // given
    const task = elementRegistry.get('Task_1');

    refactoringsPopupMenuProvider.setResult(new Promise(() => {}));
    contextPad.open(task);

    const icon = domQuery('#refactoring-action-placeholder .refactoring-icon');

    // when
    await act(() => icon.click());

    // then
    expect(domQuery('.cds--loading')).to.exist;
  }));


  it('should show disabled state when no refactorings are available', inject(async function(elementRegistry, contextPad, refactoringsPopupMenuProvider) {

    // given
    const task = elementRegistry.get('Task_1');

    refactoringsPopupMenuProvider.setResult([]);

    // when
    contextPad.open(task);

    // then
    waitFor(() => {
      expect(domQuery('.no-refactorings-available')).to.exist;
    });
  }));


  it('should open popup menu on click', inject(async function(elementRegistry, contextPad, refactoringsPopupMenuProvider, popupMenu) {

    // given
    const task = elementRegistry.get('Task_1');
    popupMenu.open = sinon.spy();

    refactoringsPopupMenuProvider.setResult([ 'some-refactoring' ]);
    contextPad.open(task);

    const icon = domQuery('#refactoring-action-placeholder .refactoring-icon');

    // when
    await act(() => icon.click());

    // then
    waitFor(() => {
      expect(popupMenu.open).to.have.been.called;
    });

  }));

});


