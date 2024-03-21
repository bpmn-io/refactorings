
/**
   * An entry provider for the popup menu that shows available refactorings.
   */
export default class RefactoringsPopupMenuProvider {
  constructor(popupMenu, translate, refactorings) {
    this._popupMenu = popupMenu;
    this._translate = translate;
    this._refactorings = refactorings;

    this._fetchedRefactorings = new Map();

    this.register();
  }

  async fetchRefactoringActions(element) {
    const refactorings = await this._refactorings.getRefactorings([ element ]);

    this._fetchedRefactorings.set(element, refactorings);

    return refactorings;
  }

  register() {
    this._popupMenu.registerProvider('refactoring-actions', this);
  }

  getPopupMenuEntries(element) {
    const refactorings = this._fetchedRefactorings.get(element) || [];

    return refactorings.reduce((entries, refactoring) => {
      entries[ refactoring.id ] = {
        label: refactoring.label || refactoring.name,
        action: () => {
          refactoring.execute([ element ]);
        }
      };
      return entries;
    }, {});
  }
}

RefactoringsPopupMenuProvider.$inject = [
  'popupMenu',
  'translate',
  'refactorings'
];

