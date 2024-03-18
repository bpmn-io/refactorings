export default class CustomContextPadProvider {
  constructor(contextPad, refactorings, suggestionsOverlays, popupMenu, refactoringActionsEntryProvider) {
    contextPad.registerProvider(100, this);

    this._refactorings = refactorings;
    this._suggestionOverlays = suggestionsOverlays;
    this._popupMenu = popupMenu;
    this._refactoringActionsEntryProvider = refactoringActionsEntryProvider;
  }

  _getPopupMenuPosition(event) {
    const target = event.currentTarget;
    const Y_OFFSET = 10;


    const targetBB = target.getBoundingClientRect();
    return {
      x: targetBB.left,
      y: targetBB.bottom + Y_OFFSET
    };
  }

  getContextPadEntries(element) {
    const self = this;

    return function(entries) {
      return {
        ...entries,
        alert: {
          action: async (event, target, autoActivate) => {
            const suggestedRefactoring = await self._refactoringActionsEntryProvider.fetchRefactoringActions(element);

            if (suggestedRefactoring) {
              self._popupMenu.open(element, 'refactoring-actions',
                self._getPopupMenuPosition(event),
                {
                  title: 'Apply Refactorings',
                  width: 350
                }
              );
            }
            else {
              console.log('No refactorings');
            }
          },
          group: 'suggest-refactoring',
          className: 'suggest-refactoring',
          html: `<div class="entry" title="Suggest refactoring">
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
          </div>`
        }
      };
    };
  }
}

CustomContextPadProvider.$inject = [
  'contextPad',
  'refactorings',
  'suggestionsOverlays',
  'popupMenu',
  'refactoringActionMenu'
];
