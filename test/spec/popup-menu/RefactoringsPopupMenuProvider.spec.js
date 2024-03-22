import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import {
  queryAll as domQueryAll,
} from 'min-dom';

import { CloudElementTemplatesCoreModule } from 'bpmn-js-element-templates';

import RefactoringsModule from '../../../lib/refactorings';
import RefactoringsPopupMenuModule from '../../../lib/popup-menu/';

import diagramXML from '../../fixtures/bpmn/simple.bpmn';

describe('Popup Menu', function() {

  beforeEach(bootstrapModeler(diagramXML, {
    additionalModules: [
      CloudElementTemplatesCoreModule,
      RefactoringsPopupMenuModule,
      RefactoringsModule
    ]
  }));


  it('should fetch entries', inject(function(elementRegistry, refactoringsPopupMenuProvider, refactorings) {

    // given
    const task = elementRegistry.get('Task_1');
    refactorings.getRefactorings = sinon.spy();

    // when
    refactoringsPopupMenuProvider.fetchRefactoringActions(task);

    // then
    expect(refactorings.getRefactorings).to.have.been.calledWith([ task ]);
  }));


  it('should fetch entries', inject(async function(elementRegistry, refactoringsPopupMenuProvider, refactorings) {

    // given
    const task = elementRegistry.get('Task_1');
    refactorings.getRefactorings = sinon.spy();

    // when
    await refactoringsPopupMenuProvider.fetchRefactoringActions(task);

    // then
    expect(refactorings.getRefactorings).to.have.been.calledWith([ task ]);
  }));


  it('should add entries after fetching', inject(async function(elementRegistry, refactoringsPopupMenuProvider, refactorings, popupMenu) {

    // given
    const task = elementRegistry.get('Task_1');
    refactorings.getRefactorings = () => [ { id: 'foo', label: 'foo' }, { id: 'bar', label: 'bar' } ];

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

});


