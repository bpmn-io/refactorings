# @bpmn-io/refactorings 👷

Refactorings for bpmn-js, powered by AI!

## Setup

```bash
echo 'OPEN_API_KEY="YOUR_OPEN_API_KEY"' > .env
npm install
npm start
```

Run the tests:

```bash
# run tests
npm test

# run OpenAI tests
npm run test:openai
```

Update the [tool descriptions](https://platform.openai.com/docs/api-reference/assistants/createAssistant#assistants-createassistant-tools) used for refactorings powered by OpenAI:

```bash
# fetch latest element templates from camunda/web-modeler repository
npm run fetch-element-templates

# create tool descriptions
npm run create-element-template-tool-descriptions

# or create tool descriptions using OpenAI
npm run create-element-template-tool-descriptions:openai
```

## License

MIT