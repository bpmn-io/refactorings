import { html, render, useEffect, useRef, useState } from '@bpmn-io/diagram-js-ui';
import { query as domQuery } from 'min-dom';

export default class RefactoringsContextPadProvider {
  constructor(contextPad, refactorings, popupMenu, refactoringsPopupMenuProvider, eventBus) {
    contextPad.registerProvider(10, this);

    this._refactorings = refactorings;
    this._popupMenu = popupMenu;
    this._refactoringsPopupMenuProvider = refactoringsPopupMenuProvider;

    eventBus.on('contextPad.open', 100, this._renderEntry.bind(this));
    eventBus.on('contextPad.close', 100, this._removeEntry.bind(this));
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
        title: 'Apply refactorings',
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
        setClass=${(name) => placeHolder.classList.toggle(name) }
        refactoringsPopupMenuProvider=${this._refactoringsPopupMenuProvider}
        openPopupMenu=${() => this._openPopupMenu(current.pad.html, current.target)}
      />`, placeHolder
      );
    }
  }

  _removeEntry({ current }) {
    const placeHolder = domQuery('#RefactoringActionPlaceholder', current.pad.html);
    render(null, placeHolder);
  }
}

RefactoringsContextPadProvider.$inject = [
  'contextPad',
  'refactorings',
  'popupMenu',
  'refactoringsPopupMenuProvider',
  'eventBus'
];

function RefactoringActionItem(props) {
  const {
    element,
    refactoringsPopupMenuProvider,
    openPopupMenu,
    setClass
  } = props;

  const [ loadingState, setLoadingState ] = useState('INITIAL');
  const previousLoadingState = usePrevious(loadingState);

  useEffect(() => {
    const load = async () => {
      const suggestedRefactoring = await refactoringsPopupMenuProvider.fetchRefactoringActions(element);

      if (suggestedRefactoring[0]) {
        setLoadingState('LOADED');
      } else {
        setLoadingState('EMPTY');
        setClass('empty');
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (previousLoadingState === 'LOADING' && loadingState === 'LOADED') {
      openPopupMenu();
    }
  }, [ loadingState, previousLoadingState ]);

  return html`
    ${loadingState === 'INITIAL' ? html`<div onClick=${() => setLoadingState('LOADING')} role="button">
      <${RefactoringIcon} title="Suggest refactoring"/>
      </div>` : null}
    ${loadingState === 'LOADING' ? html`<${LoadingIcon} />` : null}
    ${loadingState === 'EMPTY' ? html`<${RefactoringIcon} domclass="no-refactorings-available" title="No suggestions available"/>` : null}
    ${loadingState === 'LOADED' ? html`<div onClick=${openPopupMenu} role="button">
        <${RefactoringIcon} title="Suggest refactoring"/>
      </div>` : null}
  `;
}

function RefactoringIcon(props) {
  const {
    title,
    domclass = ''
  } = props;

  return html`<div class="entry ${domclass}" title="${title}" >
  <svg width="30" height="30" viewBox="6 6 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M16.7219 13.2691L16.7212 13.2684C15.6661 12.2119 14.7435 10.4757 14.0638 9.00772C14.0445 9.00316 14.0206 9 13.9941 9C13.9675 9 13.9436 9.00316 13.9243 9.00773C13.2447 10.4757 12.322 12.2122 11.2662 13.2687C10.2106 14.325 8.47501 15.2485 7.00803 15.9287C7.00329 15.9483 7 15.9728 7 16C7 16.0271 7.00325 16.0515 7.00794 16.071C8.47467 16.751 10.2101 17.6743 11.2659 18.7311C12.322 19.7875 13.2448 21.5244 13.9245 22.9923C13.9437 22.9969 13.9675 23 13.994 23C14.0205 23 14.0444 22.9968 14.0636 22.9923C14.7433 21.5244 15.666 19.7877 16.7215 18.7315M16.7215 18.7315C17.773 17.6791 19.4531 16.7468 20.8721 16.0577C20.8756 16.0415 20.878 16.0217 20.878 15.9998C20.878 15.9779 20.8756 15.9582 20.8721 15.942C19.4537 15.2529 17.7734 14.3207 16.7219 13.2691" fill="currentcolor"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M22.4808 9.52468L22.4805 9.52442C22.1037 9.14711 21.7742 8.52704 21.5315 8.00276C21.5246 8.00113 21.5161 8 21.5066 8C21.4971 8 21.4885 8.00113 21.4817 8.00276C21.2389 8.52705 20.9094 9.14721 20.5323 9.52455C20.1553 9.9018 19.5355 10.2316 19.0116 10.4745C19.0099 10.4815 19.0087 10.4903 19.0087 10.5C19.0087 10.5097 19.0099 10.5184 19.0115 10.5254C19.5354 10.7682 20.1552 11.098 20.5322 11.4754C20.9094 11.8527 21.239 12.473 21.4817 12.9972C21.4886 12.9989 21.4971 13 21.5066 13C21.516 13 21.5246 12.9989 21.5314 12.9972C21.7742 12.473 22.1037 11.8528 22.4806 11.4755M22.4806 11.4755C22.8562 11.0997 23.4562 10.7667 23.963 10.5206C23.9643 10.5148 23.9651 10.5078 23.9651 10.4999C23.9651 10.4921 23.9643 10.4851 23.963 10.4793C23.4565 10.2332 22.8563 9.90026 22.4808 9.52468" fill="currentcolor"/>
  </svg>
</div>`;
}

function LoadingIcon() {
  return html`
  <div class="cds--layout">
<div class="cds--loading cds--loading--small">
  <svg viewBox="0 0 100 100" class="cds--loading__svg">
  <title>Loading</title> 
  <circle cx="50%" cy="50%" class="cds--loading__stroke" r="40"></circle>
</svg>
</div>
</div>`;
}


function usePrevious(value) {
  const currentRef = useRef(value);
  const previousRef = useRef();
  if (currentRef.current !== value) {
    previousRef.current = currentRef.current;
    currentRef.current = value;
  }
  return previousRef.current;
}