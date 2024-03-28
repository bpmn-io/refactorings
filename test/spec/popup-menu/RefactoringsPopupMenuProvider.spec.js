import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import {
  query as domQuery,
  queryAll as domQueryAll,
} from 'min-dom';

import { CloudElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import RefactoringsModule from '../../../lib/refactorings';
import RefactoringsPopupMenuModule from '../../../lib/popup-menu/';

import diagramXML from '../../fixtures/bpmn/simple.bpmn';
import { waitFor } from '@testing-library/preact';

describe('Popup Menu', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      CloudElementTemplatesCoreModule,
      RefactoringsPopupMenuModule,
      RefactoringsModule
    ],
    refactorings: {
      openai: {
        createChatCompletion: () => {}
      }
    }
  }));


  it('should fetch refactorings', inject(function(elementRegistry, refactoringsPopupMenuProvider, refactorings) {

    // given
    const task = elementRegistry.get('Task_1');

    refactorings.getRefactorings = sinon.spy();

    // when
    refactoringsPopupMenuProvider.fetchRefactoringActions(task);

    // then
    expect(refactorings.getRefactorings).to.have.been.calledWith([ task ]);
  }));


  it('should show entries after fetching', inject(async function(elementRegistry, refactoringsPopupMenuProvider, refactorings, popupMenu) {

    // given
    const task = elementRegistry.get('Task_1');

    refactorings.getRefactorings = () => [
      { id: 'foo', label: 'foo' },
      { id: 'bar', label: 'bar' }
    ];

    // when
    await refactoringsPopupMenuProvider.fetchRefactoringActions(task);

    popupMenu.open(task, 'refactoring-actions', {
      position: { x: 0, y: 0 }
    });

    // then
    const entries = [ ...domQueryAll('.djs-popup.refactoring-actions .entry') ];

    expect(entries).to.have.length(2);
    expect(entries.map(entry => entry.getAttribute('data-id'))).to.eql([
      'foo',
      'bar'
    ]);
  }));


  it('should show loading indicator', inject(async function(elementRegistry, refactorings, popupMenu) {

    // given
    const task = elementRegistry.get('Task_1');

    refactorings.getRefactorings = () => new Promise(() => {});

    // when
    popupMenu.open(task, 'refactoring-actions', {
      position: { x: 0, y: 0 }
    });

    // then
    expect(domQuery('.djs-popup-no-results')).to.exist;
    expect(domQuery('.djs-popup-no-results .cds--inline-loading')).to.exist;
  }));


  it('should show empty state', inject(async function(elementRegistry, refactorings, popupMenu) {

    // given
    const task = elementRegistry.get('Task_1');

    refactorings.getRefactorings = () => Promise.resolve([]);

    // when
    popupMenu.open(task, 'refactoring-actions', {
      position: { x: 0, y: 0 }
    });

    // then
    waitFor(() => {
      expect(domQuery('.djs-popup-no-results .cds--inline-loading')).not.to.exist;
    });

    expect(domQuery('.djs-popup-no-results')).to.exist;
  }));


  it('should show entries when loading finished', inject(async function(elementRegistry, refactorings, popupMenu) {

    // given
    const task = elementRegistry.get('Task_1');

    let resolve;

    refactorings.getRefactorings = () => new Promise((r) => {resolve = r;});

    popupMenu.open(task, 'refactoring-actions', {
      position: { x: 0, y: 0 }
    });

    // assume
    expect(domQuery('.djs-popup-no-results')).to.exist;
    expect(domQuery('.djs-popup-no-results .cds--inline-loading')).to.exist;

    // when
    resolve([
      { id: 'foo', label: 'foo' },
      { id: 'bar', label: 'bar' }
    ]);

    // then
    waitFor(() => {
      const entries = [ ...domQueryAll('.djs-popup.refactoring-actions .entry') ];

      expect(entries).to.have.length(2);
      expect(entries.map(entry => entry.getAttribute('data-id'))).to.eql([
        'foo',
        'bar'
      ]);
    });
  }));


  it('should show empty state when loading finished', inject(async function(elementRegistry, refactorings, popupMenu) {

    // given
    const task = elementRegistry.get('Task_1');

    let resolve;

    refactorings.getRefactorings = () => new Promise((r) => {resolve = r;});

    popupMenu.open(task, 'refactoring-actions', {
      position: { x: 0, y: 0 }
    });

    // assume
    expect(domQuery('.djs-popup-no-results')).to.exist;
    expect(domQuery('.djs-popup-no-results .cds--inline-loading')).to.exist;

    // when
    resolve([]);

    // then
    waitFor(() => {
      expect(domQuery('.djs-popup-no-results')).to.exist;
      expect(domQuery('.djs-popup-no-results .cds--inline-loading')).not.to.exist;
    });
  }));

});