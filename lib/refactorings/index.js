import Refactorings from './Refactorings';

import OpenAIElementTemplatesProvider from './providers/open-ai-element-emplates/OpenAIElementTemplatesProvider';

export default {
  __init__: [
    'refactorings',
    'openAIElementTemplatesProvider'
  ],
  refactorings: [ 'type', Refactorings ],
  openAIElementTemplatesProvider: [ 'type', OpenAIElementTemplatesProvider ]
};