import CommandStackPreview from './CommandStackPreview';
import CustomContextPadProvider from './CustomContextPadProvider';
import Refactorings from './Refactorings';
import SuggestionsOverlays from './SuggestionsOverlays';

export default {
  __init__: [
    'commandStackPreview',
    'customContextPadProvider',
    'refactorings',
    'suggestionsOverlays'
  ],
  commandStackPreview: [ 'type', CommandStackPreview ],
  customContextPadProvider: [ 'type', CustomContextPadProvider ],
  refactorings: [ 'type', Refactorings ],
  suggestionsOverlays: [ 'type', SuggestionsOverlays ]
};
