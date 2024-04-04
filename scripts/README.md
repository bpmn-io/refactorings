## Updating Element Template Tool Descriptions

To update the [tool descriptions](https://platform.openai.com/docs/api-reference/assistants/createAssistant#assistants-createassistant-tools) used for refactorings powered by OpenAI run:

```bash
# fetch latest element templates from camunda/web-modeler repository
npm run fetch-element-templates

# create tool descriptions
npm run create-element-template-tool-descriptions

# or create tool descriptions using OpenAI
npm run create-element-template-tool-descriptions:openai
```

### Fetch Element Templates

The `fetch-element-templates` script fetches the latest element templates from the [camunda/web-modeler repository](https://github.com/camunda/web-modeler/tree/main/webapp/src/App/Pages/Diagram/BpmnJSExtensions/connectorsExtension/.camunda/element-templates) and stores them in the `test/fixtures/element-templates` directory. Furthermore, it creates an `all.json` file that contains all element templates.

### Create Element Template Tool Descriptions

The `create-element-template-tool-descriptions` script creates tool descriptions for each tool. The tool descriptions are stored in the `lib/refactorings/providers/open-ai-element-templates/elementTemplateToolDescriptions.json` file.

Initially, a description will be generated for each element template. Afterwards, some tools will be combined before generating a name for each tool. Finally, some tools will be added manually.

To update the tool descriptions when the element templates have changed, first run the `fetch-element-templates` script and compare the changes. Then run the `create-element-template-tool-descriptions` script and compare the changes.

Since the tool descriptions and names are generated using OpenAI, the results will be different each time.