/* eslint-env node */

const fs = require('fs');

const OpenAI = require('openai');

require('dotenv').config();

function getLatestTemplate(templates, id) {
  return templates.reduce((latestTemplate, template) => {
    if (template.id === id && (!latestTemplate || template.version > latestTemplate.version)) {
      return template;
    }

    return latestTemplate;
  }, null);
}

function getTemplateDescription(targetFilePath) {
  let descriptions = {};

  const templates = JSON.parse(fs.readFileSync(targetFilePath));

  templates.forEach(template => {
    const { id } = template;

    const latestTemplate = getLatestTemplate(templates, id);

    if (!descriptions[ latestTemplate.id ]) {
      const { description = '' } = latestTemplate;

      descriptions[ latestTemplate.id ] = description;
    }
  });

  return descriptions;
}

async function generateToolDescriptions(collectedDescriptions) {
  const openAIApiKey = process.env.OPENAI_API_KEY;

  const openai = new OpenAI({
    apiKey: openAIApiKey,
    dangerouslyAllowBrowser: true
  });

  console.log('Using OpenAI to generate descriptions');

  for (const [ id, description ] of Object.entries(collectedDescriptions)) {
    console.log('Using OpenAI to generate description for:', description);

    const response = await openai.chat.completions.create({
      messages: [
        {
          'role': 'system',
          'content': `You are an expert in BPMN modeling and an excellent
prompt engineer. Your BPMN modeler has the concept of connector templates that
can be used to automatically add properties to an element to connect to a
service or platform. Your BPMN modeler can suggest the right connector based on
an element's name. Given the description of a connector template please
provide a description of a tool that can use the connector template to add the
required properties. Here are some examples:

Connector template description: "Create a channel or send a message to a channel or user"
Tool description: "Can apply a Slack connector template to an element with a name similar to Send Slack notification."

Connector template description: "Create folder or a file from template"
Tool description: "Can apply a Google Drive connector template to an element with a name similar to Create Google Drive folder."

If the connector template description mentions deprectation, simply ignore it as
it is not relevant to the tool description.
When responding do not include "Tool description:" or quotation marks in your
response!
Respond only with the tool description!`
        },
        {
          'role': 'user',
          'content': `Connector template description: "${ description }"`
        }
      ],
      model: 'gpt-4-1106-preview'
    });

    const generatedDescription = response.choices[0].message.content;

    console.log('Generated description:', generatedDescription);

    collectedDescriptions[ id ] = generatedDescription;
  }

  return collectedDescriptions;
}

function updateTemplateHandlerDescriptions(targetFilePath, descriptions) {
  fs.writeFileSync(targetFilePath, JSON.stringify(descriptions, null, 2));
}

(async function() {
  let collectedDescriptions = getTemplateDescription('test/fixtures/element-templates/all.json');

  if (process.env.USE_OPENAI) {
    collectedDescriptions = await generateToolDescriptions(collectedDescriptions);
  }

  updateTemplateHandlerDescriptions('lib/refactorings/providers/open-ai/handlers/elementTemplateHandlerDescriptions.json', collectedDescriptions);

  console.log('Updated descriptions');
})();
