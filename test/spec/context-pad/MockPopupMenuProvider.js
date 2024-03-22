
/**
   * An entry provider for the popup menu that shows available refactorings.
   */
export class MockPopupMenuProvider {
  constructor() {
    this.resolve = () => {};
    this.promise = null;
    this.result = null;
  }

  fetchRefactoringActions() {
    return this.result;
  }

  setResult(result) {
    this.result = result;
  }
}

MockPopupMenuProvider.$inject = [];

export default {
  __init__: [
    'refactoringsPopupMenuProvider',
  ],
  refactoringsPopupMenuProvider: [ 'type', MockPopupMenuProvider ]
};