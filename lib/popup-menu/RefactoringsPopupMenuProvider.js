
/**
   * An entry provider for the popup menu that shows available refactorings.
   */
export default class RefactoringsPopupMenuProvider {
  constructor(popupMenu, eventBus, translate, refactorings) {
    this._popupMenu = popupMenu;
    this._eventBus = eventBus;
    this._translate = translate;
    this._refactorings = refactorings;

    this._refactoringsCache = new Map();

    this.register();
  }

  async fetchRefactoringActions(element) {
    const chachedRefactorings = this._refactoringsCache.get(element);

    if (chachedRefactorings) {
      return chachedRefactorings;
    }

    const refactoring = await this._refactorings.getSuggestedRefactoring(element);

    this._refactoringsCache.set(element, [ refactoring ]);

    return [ refactoring ];
  }

  register() {
    this._popupMenu.registerProvider('refactoring-actions', this);
  }

  getPopupMenuEntries(element) {
    const refactorings = this._refactoringsCache.get(element);

    return refactorings.reduce((entries, refactoring) => {
      entries[ refactoring.id ] = {
        label: refactoring.label || refactoring.name,
        action: () => {
          this._refactorings.refactor(element, refactoring);
        }
      };
      return entries;
    }, {});
  }
}

RefactoringsPopupMenuProvider.$inject = [
  'popupMenu',
  'eventBus',
  'translate',
  'refactorings'
];

