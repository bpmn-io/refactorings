# Refactorings 👷

Refactorings for bpmn-js, powered by AI!

## Setup

```bash
echo 'OPEN_API_KEY="YOUR_OPEN_API_KEY"' > .env
npm install
npm start
```

Updating element template hander descriptions:

```bash
# fetch latest element templates from camunda/web-modeler repository
npm run fetch-element-templates

# create handler descriptions
npm run create-element-template-handler-descriptions

# or create handler descriptions using OpenAI
npm run create-element-template-handler-descriptions:openai
```

## License

MIT