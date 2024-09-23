import { html } from 'diagram-js/lib/ui';

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
    this._fetchedRefactorings = await this._refactorings.getRefactorings([ element ]);

    // TODO: temporary workaround; if promise resolves immediately, event is
    // captured by popup menu resulting in popup menu being closed; adding
    // timeout prevents popup menu from capturing event
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
      return html`<span><${ LoadingIcon } translate=${ this._translate } /></span>`;
    } else {
      return this._translate('There are currently no suggestion available for this element. Please try again with a different element.');
    }

  }
}

RefactoringsPopupMenuProvider.$inject = [
  'popupMenu',
  'translate',
  'refactorings',
  'eventBus'
];

function LoadingIcon({ translate }) {
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
        <div class="cds--inline-loading__text">${translate('Loading suggestions...')}</div>
      </div>
    </div>
`;
}
