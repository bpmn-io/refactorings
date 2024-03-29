# @bpmn-io/refactorings 👷

Refactorings for bpmn-js, powered by AI!

## Setup

```bash
echo 'OPENAI_API_KEY="YOUR_OPENAI_API_KEY"' > .env
npm install
npm start
```

### Optional

The number of OpenAI requests to run per test defaults to 10.
You can change this by setting the `TEST_OPENAI_REQUESTS` environment variable
for faster/cheaper tests, e.g. while developing:

```bash
echo 'OPENAI_API_KEY="YOUR_OPENAI_API_KEY"' > .env
echo 'TEST_OPENAI_REQUESTS=1' >> .env
```

## Testing

Run the tests:

```bash
# run tests
npm test

# run OpenAI tests
npm run test:openai
```

## Updating Element Templates

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