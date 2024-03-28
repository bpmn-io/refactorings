/**
 * @typedef { {
 *   name: string;
 *   arguments: Object;
 * } } ToolCall
 */

import { inject } from 'test/TestHelper';

import { FALLBACK_TOOL_NAME } from '../../../../../lib/refactorings/providers/open-ai/OpenAIProvider';

import { typeToString } from '../../../../../lib/refactorings/providers/open-ai/util';

const testOpenai = window.__env__ && window.__env__.TEST_OPENAI === 'true';

export function toolCall(name, args = {}) {
  return {
    name,
    arguments: args
  };
}

/**
 * Expect tool calls for given element type and name. By default 10 requests are
 * sent and 100% of them must return exactly the expected tool calls.
 *
 * @param {string} elementType Type of BPMN element
 * @param {string} elementName Name of BPMN element
 * @param {ToolCall[]} expected Expected tool names
 * @param {Object} [options] Options
 * @param {Function} [options.compareToolCalls] Custom tool call comparison function
 * @param {number} [options.expectedPercentage=100] Percentage of requests that must return expected
 * @param {number} [options.numerOfRequests=10] Number of requests to send
 * @param {number} [options.only] Only run this test
 */
export function expectToolCalls(elementType, elementName, expected, options = {}) {
  const {
    compareToolCalls = toolCallsEqual,
    expectedPercentage = 100,
    numberOfRequests = 10,
    only = false
  } = options;

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
      for (let i = 0; i < numberOfRequests; i++) {
        promises.push(provider._openAIClient.getToolCalls(element, tools));
      }

      const results = await Promise.all(promises);

      // then
      const numberOfRequiredEqual = Math.ceil(expectedPercentage / 100 * numberOfRequests);

      const resultsEqual = results.filter(result => compareToolCalls(result, expected));

      const numberOfResultsEqual = resultsEqual.length;

      console.log(`Expecting ${ formatToolCalls(expected) } for ${ typeToString(element) } "${ elementName }"`);

      if (numberOfResultsEqual < numberOfRequiredEqual) {
        console.log(`🔴 ${ numberOfResultsEqual }/${ numberOfRequests } as expected (${ expectedPercentage }% required)`);
      } else {
        console.log(`🟢 ${ numberOfResultsEqual }/${ numberOfRequests } as expected (${ expectedPercentage }% required)`);
      }

      results.forEach((result, index) => {
        console.log(`${index + 1}/${numberOfRequests} Expected ${ formatToolCalls(expected) }, got ${ formatToolCalls(result) }`);
      });

      expect(numberOfResultsEqual).to.be.at.least(numberOfRequiredEqual, `Expected ${ numberOfRequiredEqual }/${ numberOfRequests } but got ${ numberOfResultsEqual }`);
    }));

  });
}

expectToolCalls.only = function(elementType, elementName, expected, options) {
  return expectToolCalls(elementType, elementName, expected, { ...options, only: true });
};

/**
 * Expect no tool calls for given element type and name. No tool calls includes
 * the fallback tool call if no other tool call is returned.
 *
 * @param {string} elementType Type of BPMN element
 * @param {string} elementName Name of BPMN element
 * @param {ToolCall[]} expected Expected tool names
 * @param {Object} [options] Options
 * @param {number} [options.expectedPercentage=100] Percentage of requests that must return expected
 * @param {number} [options.numerOfRequests=10] Number of requests to send
 * @param {number} [options.only] Only run this test
 */
export function expectNoToolCalls(elementType, elementName, options = {}) {
  return expectToolCalls(elementType, elementName, [], {
    ...options,
    compareToolCalls: (result, _) => !result.length || result.length === 1 && result[ 0 ].name === FALLBACK_TOOL_NAME
  });
}

expectNoToolCalls.only = function(elementType, elementName, options) {
  return expectNoToolCalls(elementType, elementName, { ...options, only: true });
};

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