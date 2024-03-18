import { html, render, useEffect, useState } from '@bpmn-io/diagram-js-ui';
import { query as domQuery } from 'min-dom';

export default class CustomContextPadProvider {
  constructor(contextPad, refactorings, suggestionsOverlays, popupMenu, refactoringActionsEntryProvider, eventBus) {
    contextPad.registerProvider(100, this);

    this._refactorings = refactorings;
    this._suggestionOverlays = suggestionsOverlays;
    this._popupMenu = popupMenu;
    this._refactoringActionsEntryProvider = refactoringActionsEntryProvider;

    eventBus.on('contextPad.open', this._renderEntry.bind(this));
  }

  _getPopupMenuPosition(target) {
    const Y_OFFSET = 10;


    const targetBB = target.getBoundingClientRect();
    return {
      x: targetBB.left,
      y: targetBB.bottom + Y_OFFSET
    };
  }

  getContextPadEntries(element) {
    return function(entries) {
      return {
        ...entries,
        alert: {
          action: () => {},
          group: 'suggest-refactoring',
          className: 'suggest-refactoring',
          html: '<div id="RefactoringActionPlaceholder" class="entry"></div>'
        }
      };
    };
  }

  _openPopupMenu(pad, element) {
    this._popupMenu.open(element, 'refactoring-actions',
      this._getPopupMenuPosition(pad),
      {
        title: 'Apply Refactorings',
        width: 350
      }
    );
  }

  // Hook into context pad rending events to add Preact Micro-Frontend
  // In the future, we want the context pad to support Preact components natively
  _renderEntry({ current }) {
    const placeHolder = domQuery('#RefactoringActionPlaceholder', current.pad.html);

    if (placeHolder) {
      render(html`<${RefactoringActionItem}
        element=${current.target}
        setClass=${(name) => {placeHolder.parentElement.classList.toggle(name);}}
        refactoringActionsEntryProvider=${this._refactoringActionsEntryProvider}
        openPopupMenu=${() => this._openPopupMenu(current.pad.html, current.target)}
      />`, placeHolder
      );
    }
  }
}

CustomContextPadProvider.$inject = [
  'contextPad',
  'refactorings',
  'suggestionsOverlays',
  'popupMenu',
  'refactoringActionMenu',
  'eventBus'
];

function RefactoringActionItem(props) {
  const {
    element,
    refactoringActionsEntryProvider,
    openPopupMenu,
    setClass
  } = props;

  const [ loadingState, setLoadingState ] = useState('LOADING');

  useEffect(() => {
    const load = async () => {
      const suggestedRefactoring = await refactoringActionsEntryProvider.fetchRefactoringActions(element);

      if (suggestedRefactoring) {
        setLoadingState('LOADED');
        setClass('active');
      } else {
        setLoadingState('EMPTY');
      }
    };

    load();
  }, []);

  return html`
    ${loadingState === 'LOADING' ? html`<${LoadingIcon} />` : null}
    ${loadingState === 'EMPTY' ? html`<${EmptyIcon}/>` : null}
    ${loadingState === 'LOADED' ? html`<div onClick=${openPopupMenu} role="button">
        <${RefactoringIcon} />
      </div>` : null}
  `;
}

function RefactoringIcon(props) {
  return html`<div class="entry" title="Suggest refactoring" >
                <svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                  <defs>
                    <style>.cls-1{fill:none;}</style>
                  </defs>
                  <title>Suggest refactoring</title>
                  <path fill="white" d="M29.4141,24,12,6.5859a2.0476,2.0476,0,0,0-2.8281,0l-2.586,2.586a2.0021,2.0021,0,0,0,0,2.8281L23.999,29.4141a2.0024,2.0024,0,0,0,2.8281,0l2.587-2.5865a1.9993,1.9993,0,0,0,0-2.8281ZM8,10.5859,10.5859,8l5,5-2.5866,2.5869-5-5ZM25.4131,28l-11-10.999L17,14.4141l11,11Z"/>
                  <rect fill="white" x="2.5858" y="14.5858" width="2.8284" height="2.8284" transform="translate(-10.1421 7.5147) rotate(-45)"/>
                  <rect fill="white" x="14.5858" y="2.5858" width="2.8284" height="2.8284" transform="translate(1.8579 12.4853) rotate(-45)"/>
                  <rect fill="white" x="2.5858" y="2.5858" width="2.8284" height="2.8284" transform="translate(-1.6569 4) rotate(-45)"/>
                  <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/>
                </svg>
              </div>`;
}

function LoadingIcon(props) {
  return html`
  <div class="cds--layout">
<div class="cds--loading cds--loading--small">
  <svg viewBox="0 0 100 100" class="cds--loading__svg">
    <title>Loading</title> 
    <circle cx="50%" cy="50%" class="cds--loading__stroke" r="44"></circle>
  </svg>
</div>
</div>`;
}

function EmptyIcon(props) {
  return html`
      <svg xmlns="http://www.w3.org/2000/svg" class="no-refactorings-available" viewBox="0 0 32 32" fill="white"><defs><style>.cls-1{fill:none;}</style></defs><title>No Refactorings Available</title><g id="Icon-2" data-name="Icon"><path d="M2,16H2A14,14,0,1,0,16,2,14,14,0,0,0,2,16Zm23.15,7.75L8.25,6.85a12,12,0,0,1,16.9,16.9ZM8.24,25.16A12,12,0,0,1,6.84,8.27L23.73,25.16a12,12,0,0,1-15.49,0Z" transform="translate(0)"/></g><g id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;"><rect class="cls-1" width="32" height="32"/></g></svg>
`;
}
