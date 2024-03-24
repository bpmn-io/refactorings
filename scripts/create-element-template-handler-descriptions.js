/**
 * @typedef { {
 *   [id: string]: {
 *     appliesTo: string[];
 *     description: string;
 *     name: string;
 *   }
 * } } TemplateDetails
 *
 * @typedef { {
 *   [id: string]: string;
 * } } TemplateDescriptions
 */

const fs = require('fs');

const OpenAI = require('openai');

const { typeToString } = require('./util');

require('dotenv').config();

function getLatestTemplate(templates, id) {
  return templates.reduce((latestTemplate, template) => {
    if (template.id === id && (!latestTemplate || template.version > latestTemplate.version)) {
      return template;
    }

    return latestTemplate;
  }, null);
}

/**
 * @param {string} targetFilePath
 *
 * @returns {TemplateDetails}
 */
function getTemplateDetails(targetFilePath) {
  let templateDetails = {};

  const templates = JSON.parse(fs.readFileSync(targetFilePath));

  templates.forEach(template => {
    const { id } = template;

    const latestTemplate = getLatestTemplate(templates, id);

    if (!templateDetails[ latestTemplate.id ]) {
      const {
        appliesTo,
        description = '',
        name
      } = latestTemplate;

      templateDetails[ latestTemplate.id ] = {
        appliesTo,
        description,
        name
      };
    }
  });

  return templateDetails;
}

/**
 * @param {TemplateDetails} templateDetails
 *
 * @returns {Promise<TemplateDescriptions>}
 */
async function generateToolDescriptions(templateDetails) {
  const openAIApiKey = process.env.OPENAI_API_KEY;

  const openai = new OpenAI({
    apiKey: openAIApiKey,
    dangerouslyAllowBrowser: true
  });

  console.log('Using OpenAI to generate descriptions');

  for (const [ id, { appliesTo, description, name } ] of Object.entries(templateDetails)) {
    console.log('Using OpenAI to generate description for:', description);

    const response = await openai.chat.completions.create({
      messages: [
        {
          'role': 'system',
          'content': `You are an expert in BPMN modeling and an excellent
prompt engineer. Your BPMN modeler has the concept of connector templates that
can be used to automatically add properties to an element to connect to a
service or platform. Your BPMN modeler can suggest the right connector based on
an element's name. Given the name and description of a connector template and
the possible element types it can be used for, please provide a description of a
tool that can use the connector template to add the required properties. Here
are some examples:

Connector template name: GitHub Webhook Message Start Event Connector
Connector template description: Receive events from GitHub
Possible element types: Start Event
Tool description: Can apply a GitHub Webhook connector template to a start event whose name mentions GitHub or has a name similar to Wait for GitHub webhook.

Connector template name: Slack Outbound Connector
Connector template description: Create a channel or send a message to a channel or user
Possible element types: Task
Tool description: Can apply a Slack connector template to a task whose name mentions Slack or has a name similar to Send Slack notification.

Connector template name: Google Drive Outbound Connector
Connector template description: Create folder or a file from template
Possible element types: Task
Tool description: Can apply a Google Drive connector template to a task whose name mentions Google Drive or has a name similar to Create Google Drive folder.

If the connector template description mentions deprectation, simply ignore it as
it is not relevant to the tool description.
When responding do not include "Tool description:" or quotation marks in your
response!
Respond only with the tool description!`
        },
        {
          'role': 'user',
          'content': `Connector template name: ${ name }
Connector template description: ${ description }
Possible element types: ${ appliesTo.map(type => typeToString(type)).join(', ') }`
        }
      ],
      model: 'gpt-4-1106-preview'
    });

    const generatedDescription = response.choices[0].message.content;

    console.log('Generated description:', generatedDescription);

    templateDetails[ id ] = generatedDescription;
  }

  return templateDetails;
}

function updateTemplateHandlerDescriptions(targetFilePath, descriptions) {
  fs.writeFileSync(targetFilePath, JSON.stringify(descriptions, null, 2));
}

(async function() {
  const templateDetails = getTemplateDetails('test/fixtures/element-templates/all.json');

  let descriptions;

  if (process.env.USE_OPENAI) {
    descriptions = await generateToolDescriptions(templateDetails);
  } else {
    descriptions = Object.entries(templateDetails).reduce((descriptions, [ id, { description } ]) => {
      return {
        ...descriptions,
        [ id ]: description
      };
    }, {});
  }

  updateTemplateHandlerDescriptions('lib/refactorings/providers/open-ai/handlers/elementTemplateHandlerDescriptions.json', descriptions);

  console.log('Updated descriptions');
})();