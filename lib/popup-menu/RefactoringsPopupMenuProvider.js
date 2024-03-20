
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

    eventBus.on('element.changed', ({ element }) => this._clearCache(element));
  }

  _clearCache(element) {
    this._refactoringsCache.delete(element);
  }

  async fetchRefactoringActions(element) {
    const chachedRefactorings = this._refactoringsCache.get(element);

    if (chachedRefactorings) {
      return chachedRefactorings;
    }

    const refactorings = await this._refactorings.getRefactorings([ element ]);

    this._refactoringsCache.set(element, refactorings);

    return refactorings;
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

