/**
 * @typedef { {
 *   [id: string]: {
 *     appliesTo: string[];
 *     description: string;
 *     name: string;
 *     properties: Object[];
 *   }
 * } } ElementTemplateDetails
 *
 * @typedef { {
 *   [toolName: string]: {
 *     appliesTo: string[];
 *     description: string;
 *     elementTemplates: string[];
 *   }
 * } } ElementTemplateToolDescriptions
 */

const fs = require('fs');

const OpenAI = require('openai');

const { elementTemplateIdToToolName } = require('./util');

require('dotenv').config();

function getLatestElementTemplate(templates, id) {
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
 * @returns {ElementTemplateDetails}
 */
function getElementTemplateDetails(targetFilePath) {
  let elementTemplateDetails = {};

  const elementTemplates = JSON.parse(fs.readFileSync(targetFilePath));

  elementTemplates.forEach(elementTemplate => {
    const { id } = elementTemplate;

    const latestElementTemplate = getLatestElementTemplate(elementTemplates, id);

    if (latestElementTemplate.deprecated) {
      console.log('Ignoring deprecated template:', latestElementTemplate.id, latestElementTemplate.version, latestElementTemplate.name);

      return;
    }

    if (!elementTemplateDetails[ latestElementTemplate.id ]) {
      const {
        appliesTo,
        description = '',
        name,
        properties
      } = latestElementTemplate;

      elementTemplateDetails[ latestElementTemplate.id ] = {
        appliesTo,
        description,
        name,
        properties
      };
    }
  });

  return elementTemplateDetails;
}

/**
 * @param {ElementTemplateDetails} elementTemplateDetails
 *
 * @returns {Promise<ElementTemplateToolDescriptions>}
 */
async function generateElementTemplateToolDescriptions(elementTemplateDetails) {
  const openAIApiKey = process.env.OPENAI_API_KEY;

  const openai = new OpenAI({
    apiKey: openAIApiKey,
    dangerouslyAllowBrowser: true
  });

  console.log('Using OpenAI to generate descriptions');

  const elementTemplateToolDescriptions = {};

  for (const [ id, { appliesTo, description, name, properties } ] of Object.entries(elementTemplateDetails)) {
    console.log('⏳ Using OpenAI to generate description for:', description);

    const response = await openai.chat.completions.create({
      messages: [
        {
          'role': 'system',
          'content': `You are an expert in BPMN modeling and an excellent prompt engineer.
Your BPMN modeler has the concept of templates that can be used to automatically add properties to an element to connect to a service or platform.
Your BPMN modeler can suggest the right template based on an element's name.
Given a template, please provide a description of a tool that can use the template to add the required properties.
Pay special attention to the \`id\`, \`name\` and \`description\` of the template.
Also take into account which elements it can be applied to (\`appliesTo\`).
Furthermore, have a look at the \`properties\`. You might find some of them helpful when generating example element names.
The output must be JSON!

For the description use the following pattern:

Uses <keyword> template for <element type> whose name mentions <keyword> or has a name similar to <example names>.

The <keyword> must not contain any information about the element type since it is already part of the description.

Here are some examples of generated descriptions:

{
  "description": "Uses GitHub Webhook template for message start event whose name mentions GitHub or has a name similar to Webhook received, New issue, or New pull request."
}

{
  "description": "Uses GitHub Webhook template for start event whose name mentions GitHub or has a name similar to Webhook received, New issue, or New pull request."
}

{
  "description": "Uses Slack template for task whose name mentions Slack or has a name similar to Post message, Create channel, or Invite to channel."
}

{
  "description": "Uses Google Drive template for task whose name mentions Google Drive or has a name similar to Create folder or Create file."
}

Use these example as guidance when generating the description.

Don't ever include words like "connector", "inbound", "outbound", or "HTTPS" in the description!

The description must not be longer than 200 characters!

Respond only with the tool description!`
        },
        {
          'role': 'user',
          'content': `Element template:
${ JSON.stringify({
    appliesTo,
    description,
    id,
    name: removeWords(name, [ 'inbound', 'outbound', 'connector' ]), // remove words that are not helpful for generating tool descriptions
    properties
  }, null, 2) }

Please provide a description of a tool that can use this element template.`
        }
      ],
      model: 'gpt-4-1106-preview',
      response_format: { type: 'json_object' }
    });

    const message = response.choices[0].message.content;

    const { description: toolDescription } = JSON.parse(message);

    if (!toolDescription) {
      throw new Error(`Error generating tool description for element template ID ${id}`);
    }

    const toolName = id;

    console.log('✅ Generated description:', toolDescription);

    elementTemplateToolDescriptions[ toolName ] = {
      appliesTo,
      description: toolDescription,
      elementTemplates: [ id ]
    };
  }

  return elementTemplateToolDescriptions;
}

function removeWords(string, words) {
  return words.reduce((string, word) => string.replace(new RegExp(`${ word }`, 'gi'), ''), string).trim();
}

/**
 * Adjust the default one-to-one mapping of tools to element templates. With
 * OpenAI's function calling feature, mapping one tool to one element template
 * generally works. However, OpenAI will return exactly one tool most of the
 * time. To account for this, we map multiple element templates to the same tool
 * when they are very similar (e.g. Slack start event and Slack message start
 * event element templates). We combine the descriptions of the element
 * templates using OpenAI or, as fallback, use one of them.
 *
 * @param {ElementTemplateToolDescriptions} elementTemplateToolDescriptions
 *
 * @returns {Promise<ElementTemplateToolDescriptions>}
 */
async function adjustElementTemplateToolDescriptions(elementTemplateToolDescriptions) {

  /**
   * Combines tools message start event and start event of the same type.
   *
   * @param {string} messageStartEventElementTemplateId
   * @param {string} startEventElementTemplateId
   */
  const combineStartEventTools = async (messageStartEventElementTemplateId, startEventElementTemplateId) => {
    elementTemplateToolDescriptions[ startEventElementTemplateId ] = {
      ...elementTemplateToolDescriptions[ startEventElementTemplateId ],
      description: await combineDescriptions([
        elementTemplateToolDescriptions[ messageStartEventElementTemplateId ].description,
        elementTemplateToolDescriptions[ startEventElementTemplateId ].description
      ]),
      elementTemplates: [
        messageStartEventElementTemplateId,
        startEventElementTemplateId
      ]
    };

    delete elementTemplateToolDescriptions[ messageStartEventElementTemplateId ];
  };

  /**
   * AWS EventBridge start events.
   */
  await combineStartEventTools(
    'io.camunda.connectors.AWSEventBridge.MessageStart.v1',
    'io.camunda.connectors.AWSEventBridge.startEvent.v1'
  );

  /**
   * AWS SNS start events.
   */
  await combineStartEventTools(
    'io.camunda.connectors.inbound.AWSSNS.MessageStartEvent.v1',
    'io.camunda.connectors.inbound.AWSSNS.StartEvent.v1'
  );

  /**
   * AWS SQS start events.
   */
  await combineStartEventTools(
    'io.camunda.connectors.AWSSQS.StartEvent.v1',
    'io.camunda.connectors.AWSSQS.startmessage.v1'
  );

  /**
   * GitHub start events.
   */
  await combineStartEventTools(
    'io.camunda.connectors.webhook.GithubWebhookConnector.v1',
    'io.camunda.connectors.webhook.GithubWebhookConnectorMessageStart.v1'
  );

  /**
   * Kafka start events.
   */
  await combineStartEventTools(
    'io.camunda.connectors.inbound.KAFKA.v1',
    'io.camunda.connectors.inbound.KafkaMessageStart.v1'
  );

  /**
   * RabbitMQ start events.
   */
  await combineStartEventTools (
    'io.camunda.connectors.inbound.RabbitMQ.MessageStart.v1',
    'io.camunda.connectors.inbound.RabbitMQ.StartEvent.v1'
  );

  /**
   * Slack start events.
   */
  await combineStartEventTools(
    'io.camunda.connectors.inbound.Slack.MessageStartEvent.v1',
    'io.camunda.connectors.inbound.Slack.StartEvent.v1'
  );

  /**
   * Twilio start events.
   */
  await combineStartEventTools(
    'io.camunda.connectors.TwilioWebhook.v1',
    'io.camunda.connectors.TwilioWebhookMessageStart.v1'
  );

  /**
   * Webhook start events.
   */
  await combineStartEventTools(
    'io.camunda.connectors.webhook.WebhookConnector.v1',
    'io.camunda.connectors.webhook.WebhookConnectorStartMessage.v1'
  );

  return elementTemplateToolDescriptions;
}

async function combineDescriptions(descriptions) {
  if (!process.env.USE_OPENAI) {
    return descriptions[0];
  }

  const openAIApiKey = process.env.OPENAI_API_KEY;

  const openai = new OpenAI({
    apiKey: openAIApiKey,
    dangerouslyAllowBrowser: true
  });

  console.log('⏳ Using OpenAI to combine descriptions:', descriptions.join(', '));

  const response = await openai.chat.completions.create({
    messages: [
      {
        'role': 'system',
        'content': `You are an expert in combining descriptions of tools into a
single description. Respond only with the combined description!

Here's an example of a combined description:

Descriptions:

Uses Amazon EventBridge template for start event whose name mentions AWS or EventBridge or has a name similar to Event received, Rule triggered.
Uses Amazon EventBridge template for start event mentioning AWS EventBridge or named like Event received.

Combined description:

Uses Amazon EventBridge template for start event whose name mentions AWS or EventBridge or has a name similar to Event received, Rule triggered.

It's important for the combined description to read like the description for a single element template. Focus on combining the example names if they are different but limit them to 3!`
      },
      {
        'role': 'user',
        'content': `Combine the following descriptions into a single description:
${ descriptions.join('\n') }`
      }
    ],
    model: 'gpt-4-1106-preview'
  });

  const combinedDescription = response.choices[0].message.content;

  console.log('✅ Combined description:', combinedDescription);

  return combinedDescription;
}

/**
 * Adds custom tools for generic element names (e.g. "Send email") that could
 * match multiple element templates. OpenAI will return exactly one tool most of
 * the time. When an element's name is generic (e.g. "Send email") and multiple
 * element templates could be used, OpenAI will only suggest one of them
 * (e.g. SendGrid) even if there are multiple element templates that could be
 * used. To account for this, we create a generic tool that suggests all
 * element templates that could be used.
 *
 * @param {ElementTemplateToolDescriptions} elementTemplateToolDescriptions
 *
 * @returns {ElementTemplateToolDescriptions}
 */
function addCustomElementTemplateToolDescriptions(elementTemplateToolDescriptions) {

  /**
   * Sending emails.
   */
  elementTemplateToolDescriptions['custom_sendemail'] = {
    appliesTo: [ 'bpmn:Task' ],
    description: 'Uses template for task whose name does _not_ mention any particular service and explicitly mentions sending an email (not message or notification).',
    elementTemplates: [
      'io.camunda.connectors.MSFT.O365.Mail.v1',
      'io.camunda.connectors.SendGrid.v2'
    ]
  };

  return elementTemplateToolDescriptions;
}

async function generateToolNames(elementTemplateToolDescriptions) {
  if (!process.env.USE_OPENAI) {
    return elementTemplateToolDescriptions;
  }

  const openAIApiKey = process.env.OPENAI_API_KEY;

  const openai = new OpenAI({
    apiKey: openAIApiKey,
    dangerouslyAllowBrowser: true
  });

  for (const [ toolName, { appliesTo, description } ] of Object.entries(elementTemplateToolDescriptions)) {

    console.log('⏳ Using OpenAI to generate name for:', toolName);

    const response = await openai.chat.completions.create({
      messages: [
        {
          'role': 'system',
          'content': `You are a BPMN expert and in charge of a modeling tool that can use templates to add required properties to elements.
Based on the description of a tool generate a tool name.
Also take into account which elements it can be applied to (\`appliesTo\`).
The output must be JSON!

For the tool name use the following pattern:

<keyword>_<element type>

Here are some examples of generated tool names:

{ "name": "sendgrid_task" }

{ "name": "slack_intermediatecatchevent" }

{ "name": "slack_startevent" }

Use these example as guidance when generating the name.

The name must always be lowercase!
Don't ever include words like "connector", "inbound", "outbound", or "HTTPS" in the tool name!

Respond only with the tool name!`
        },
        {
          'role': 'user',
          'content': `Element template:
${ JSON.stringify({
    appliesTo,
    description
  }, null, 2) }

Please provide a name of a tool.`
        }
      ],
      model: 'gpt-4-1106-preview',
      response_format: { type: 'json_object' }
    });

    const message = response.choices[0].message.content;

    const { name: generatedToolName } = JSON.parse(message);

    if (!generatedToolName) {
      throw new Error(`Error generating tool name for tool name ${ toolName }`);
    }

    if (elementTemplateToolDescriptions[ generatedToolName ]) {
      throw new Error(`Generated tool name ${ generatedToolName } already exists`);
    }

    elementTemplateToolDescriptions[ generatedToolName ] = elementTemplateToolDescriptions[ toolName ];

    delete elementTemplateToolDescriptions[ toolName ];

    console.log('✅ Generated tool name:', generatedToolName);
  }

  return elementTemplateToolDescriptions;
}

function updateTemplateToolDescriptions(targetFilePath, descriptions) {
  fs.writeFileSync(targetFilePath, JSON.stringify(descriptions, null, 2));
}

(async function() {

  // 1. Get element template details relevant for generating tool descriptions
  const elementTemplateDetails = getElementTemplateDetails('test/fixtures/element-templates/all.json');

  let elementTemplateToolDescriptions;

  // 2. Generate tool descriptions using OpenAI or use element template description as fallback
  if (process.env.USE_OPENAI) {
    elementTemplateToolDescriptions = await generateElementTemplateToolDescriptions(elementTemplateDetails);
  } else {
    elementTemplateToolDescriptions = Object.entries(elementTemplateDetails).reduce((elementTemplateToolDescriptions, [ id, { appliesTo, description } ]) => {
      return {
        ...elementTemplateToolDescriptions,
        [ elementTemplateIdToToolName(id) ]: {
          appliesTo,
          description,
          elementTemplates: [ id ]
        }
      };
    }, {});
  }

  // 3. Adjust default one-to-one mapping of tools to element templates where appropriate
  elementTemplateToolDescriptions = await adjustElementTemplateToolDescriptions(elementTemplateToolDescriptions);

  // 4. Generate tool names
  elementTemplateToolDescriptions = await generateToolNames(elementTemplateToolDescriptions);

  // 5. Add custom tools for generic element names (e.g. "Send email") that could match multiple element templates
  elementTemplateToolDescriptions = addCustomElementTemplateToolDescriptions(elementTemplateToolDescriptions);

  // 6. Update tool descriptions file
  updateTemplateToolDescriptions('lib/refactorings/providers/open-ai-element-templates/elementTemplateToolDescriptions.json', elementTemplateToolDescriptions);

  console.log('Updated descriptions');
})();