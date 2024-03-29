/**
 * @typedef { {
 *   name: string;
 *   arguments: Object;
 * } } ToolCall
 */

import { inject } from 'test/TestHelper';

import { typeToString } from '../../../../../lib/refactorings/providers/open-ai/util';

const testOpenai = window.__env__ && window.__env__.TEST_OPENAI === 'true';

export function toolCall(name, args = {}) {
  return {
    name,
    arguments: args
  };
}

/**
 * Expect tool calls for given element type and name. By default, 10 requests
 * will be sent to OpenAI of which 100% must return the expected tool calls.
 *
 * @param {string} elementType Type of BPMN element
 * @param {string} elementName Name of BPMN element
 * @param {ToolCall[]} expected Expected tool names
 * @param {number} [expectedPercentage=100] Percentage of requests that must return expected
 * @param {number} [numberOfRequests=10] Number of requests to send, defaults to process.env.TEST_OPENAI_REQUESTS or 10
 * tool calls
 * @param {boolean} [only=false] Run only this test
 */
export function expectToolCalls(elementType, elementName, expected, expectedPercentage = 100, numberOfRequests = -1, only = false) {
  const totalRequests = numberOfRequests === -1 ? process.env.TEST_OPENAI_REQUESTS || 10 : numberOfRequests;
  return describe(`tool calls for ${ elementType } with name "${ elementName }"`, function() {

    (testOpenai && only ? it.only : it)('should return expected tool calls', inject(async function(bpmnFactory, refactorings) {

      // given
      const element = bpmnFactory.create(elementType, {
        name: elementName
      });

      const providers = refactorings.getProviders();

      expect(providers).to.have.length(1, 'Expected exactly one provider');

      const provider = providers[ 0 ];

      const tools = provider.getTools(element);

      const promises = [];

      // when
      for (let i = 0; i < totalRequests; i++) {
        promises.push(provider._openAIClient.getToolCalls(element, tools));
      }

      const results = await Promise.all(promises);

      // then
      const numberOfRequiredEqual = Math.ceil(expectedPercentage / 100 * totalRequests);

      const resultsEqual = results.filter(result => toolCallsEqual(result, expected));

      const numberOfResultsEqual = resultsEqual.length;

      console.error(`Expecting ${ formatToolCalls(expected) } for ${ typeToString(element) } "${ elementName }"`);

      if (numberOfResultsEqual < numberOfRequiredEqual) {
        console.log(`🔴 ${ numberOfResultsEqual }/${ totalRequests } as expected (${ expectedPercentage }% required)`);
      } else {
        console.log(`🟢 ${ numberOfResultsEqual }/${ totalRequests } as expected (${ expectedPercentage }% required)`);
      }

      results.forEach((result, index) => {
        console.error(`${index + 1}/${totalRequests} Expected ${ formatToolCalls(expected) }, got ${ formatToolCalls(result) }`);
      });

      expect(numberOfResultsEqual).to.be.at.least(numberOfRequiredEqual, `Expected ${ numberOfRequiredEqual }/${ totalRequests } but got ${ numberOfResultsEqual }`);
    }));

  });
}

export function expectToolCallsOnly(elementType, elementName, expected, expectedPercentage, numberOfRequests) {
  return expectToolCalls(elementType, elementName, expected, expectedPercentage, numberOfRequests, true);
}

function formatToolCalls(toolCalls) {
  return `[ ${ toolCalls.map(({ arguments: args = '{}', name }) => `${ name }(${ formatToolArguments(args) })`).join(', ') } ]`;
}

function formatToolArguments(args = {}) {
  if (!Object.keys(args).length) {
    return '';
  }

  return Object.entries(args).map(([ key, value ]) => `${ key }: ${ value }`).join(', ');
}

/**
 * Check whether tool calls are equal. Tool calls are equal if they have the
 * same name and arguments. The order of tool calls is not important.
 *
 * @param {ToolCall[]} toolCalls1
 * @param {ToolCall[]} toolCalls2
 *
 * @returns {boolean}
 */
function toolCallsEqual(toolCalls1, toolCalls2) {
  if (toolCalls1.length !== toolCalls2.length) {
    return false;
  }

  return toolCalls1.every(toolCall1 => {
    return toolCalls2.some(toolCall2 => {
      return toolCallEqual(toolCall1, toolCall2);
    });
  });
}

/**
 * Check whether two tool calls are equal. Tool calls are equal if they have the
 * same name and arguments.
 *
 * @param {ToolCall} toolCall1
 * @param {ToolCall} toolCall2
 *
 * @returns {boolean}
 */
function toolCallEqual(toolCall1, toolCall2) {
  return toolCall1.name === toolCall2.name
    && JSON.stringify(toolCall1.arguments) === JSON.stringify(toolCall2.arguments);
}