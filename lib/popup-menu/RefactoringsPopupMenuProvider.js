import { html } from '@bpmn-io/diagram-js-ui';
import { isArray } from 'min-dash';

/**
   * An entry provider for the popup menu that shows available refactorings.
   */
export default class RefactoringsPopupMenuProvider {
  constructor(popupMenu, translate, refactorings, eventBus) {
    this._popupMenu = popupMenu;
    this._translate = translate;
    this._refactorings = refactorings;

    this._fetchedRefactorings = null;

    eventBus.on('popupMenu.closed', () => {
      this._fetchedRefactorings = null;
    });

    this.register();
  }

  async fetchRefactoringActions(element) {
    this._fetchedRefactorings = this._refactorings.getRefactorings([ element ]);
    this._fetchedRefactorings = await this._fetchedRefactorings;

    // We need to refresh the popup menu in a fresh event cycle
    // Otherwise, if the promise resolves immediately, the click event
    // in the context pad will be captured as outside the menu and force
    // the popup menu to close immediately
    window.setTimeout(() => {
      this._popupMenu.refresh();
    });

  }

  register() {
    this._popupMenu.registerProvider('refactoring-actions', this);
  }

  getPopupMenuEntries(element) {
    const refactorings = this._fetchedRefactorings;

    if (!refactorings) {
      this.fetchRefactoringActions(element);
    }

    // We are still loading
    if (!isArray(refactorings)) {
      return {};
    }

    const entries = (refactorings || []).reduce((entries, refactoring) => {
      entries[ refactoring.id ] = {
        label: refactoring.label || refactoring.name,
        action: () => {
          refactoring.execute([ element ]);
        }
      };
      return entries;
    }, {});

    return entries;
  }

  getEmptyPlaceholder() {
    if (!isArray(this._fetchedRefactorings)) {
      return html`<span><${LoadingIcon}/></span>`;
    } else {
      return 'There are no refactorings available for this element. Please try again with a different element.';
    }

  }
}

RefactoringsPopupMenuProvider.$inject = [
  'popupMenu',
  'translate',
  'refactorings',
  'eventBus'
];


function LoadingIcon() {
  return html`
      <div class="cds--layout">
        <div class="cds--inline-loading" aria-live="assertive">
          <div class="cds--inline-loading__animation">
            <div aria-atomic="true" aria-live="assertive" class="cds--loading cds--loading--small">
              <svg class="cds--loading__svg" viewBox="0 0 100 100">
                <title>Loading</title>
                <circle class="cds--loading__background" cx="50%" cy="50%" r="42"></circle>
                <circle class="cds--loading__stroke" cx="50%" cy="50%" r="42"></circle>
              </svg>
            </div>
          </div>
          <div class="cds--inline-loading__text">Loading refactorings...</div>
        </div>
      </div>
`;
}
