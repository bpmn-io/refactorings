import SuggestionsOverlays from './SuggestionsOverlays';
import Refactorings from './Refactorings';
import Commands from './cmd';

export default {
  __depends__: [ Commands ],
  __init__: [ 'refactorings', 'suggestionsOverlays' ],
  refactorings: [ 'type', Refactorings ],
  suggestionsOverlays: [ 'type', SuggestionsOverlays ]
};
