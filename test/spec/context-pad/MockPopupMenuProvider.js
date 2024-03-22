
/**
   * An entry provider for the popup menu that shows available refactorings.
   */
export class MockPopupMenuProvider {
  fetchRefactoringActions() { }

}

MockPopupMenuProvider.$inject = [];

export default {
  __init__: [
    'refactoringsPopupMenuProvider',
  ],
  refactoringsPopupMenuProvider: [ 'type', MockPopupMenuProvider ]
};