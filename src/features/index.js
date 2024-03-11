import CommandStackPreview from './CommandStackPreview';
import CustomContextPadProvider from './CustomContextPadProvider';
import RefactoringActionsEntryProvider from './RefactoringActionsMenuProvider';
import Refactorings from './Refactorings';
import SuggestionsOverlays from './SuggestionsOverlays';

export default {
  __init__: [
    'commandStackPreview',
    'customContextPadProvider',
    'refactorings',
    'suggestionsOverlays',
    'refactoringActionMenu'
  ],
  commandStackPreview: [ 'type', CommandStackPreview ],
  customContextPadProvider: [ 'type', CustomContextPadProvider ],
  refactorings: [ 'type', Refactorings ],
  suggestionsOverlays: [ 'type', SuggestionsOverlays ],
  refactoringActionMenu: [ 'type', RefactoringActionsEntryProvider ]
};
