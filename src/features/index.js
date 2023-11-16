import CommandStackPreview from './CommandStackPreview';
import Refactorings from './Refactorings';
import SuggestionsOverlays from './SuggestionsOverlays';

export default {
  __init__: [ 'commandStackPreview', 'refactorings', 'suggestionsOverlays' ],
  commandStackPreview: [ 'type', CommandStackPreview ],
  refactorings: [ 'type', Refactorings ],
  suggestionsOverlays: [ 'type', SuggestionsOverlays ]
};
