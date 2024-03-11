
/**
   * A entry provider for the <element-template-chooser> popup menu.
   */
export default class RefactoringActionsEntryProvider {

  constructor(popupMenu, eventBus, translate, suggestionsOverlays, refactorings) {

    this._popupMenu = popupMenu;
    this._eventBus = eventBus;
    this._translate = translate;
    this._suggestionsOverlays = suggestionsOverlays;
    this._refactorings = refactorings;

    this._refactoringOptions = new Map();

    this.register();
  }

  async fetchRefactoringActions(element) {

    // ToDo: Implement caching here
    const suggestedRefactoring = await this._refactorings.getSuggestedRefactoring(element);

    this._refactoringOptions.set(element, [ suggestedRefactoring ]);
    return suggestedRefactoring;
  }

  register() {
    this._popupMenu.registerProvider('refactoring-actions', this);
  }

  getPopupMenuEntries(element) {

    const refactorings = this._refactoringOptions.get(element);

    const options = refactorings.reduce((acc, refactoring) => {
      acc[refactoring.id] = {
        label: refactoring.label || refactoring.id,
        action: () => {
          this._refactorings.preview(element, refactoring);
        }
      };
      return acc;
    }, {});

    return options;
  }
}


RefactoringActionsEntryProvider.$inject = [
  'popupMenu',
  'eventBus',
  'translate',
  'suggestionsOverlays',
  'refactorings'
];

