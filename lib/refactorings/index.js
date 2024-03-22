import Refactorings from './Refactorings';

import OpenAIProiveder from './providers/open-ai/OpenAIProvider';

export default {
  __init__: [
    'refactorings',
    'openAIProvider'
  ],
  refactorings: [ 'type', Refactorings ],
  openAIProvider: [ 'type', OpenAIProiveder ]
};