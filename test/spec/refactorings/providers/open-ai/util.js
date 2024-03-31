/**
 * @typedef { {
 *   name: string;
 *   arguments: Object;
 * } } ToolCall
 */

import { inject } from 'test/TestHelper';

import { FALLBACK_TOOL_NAME } from '../../../../../lib/refactorings/providers/open-ai/OpenAIProvider';
const testOpenai = window.__env__ && window.__env__.TEST_OPENAI === 'true';

export function toolCall(name, args = {}) {
  return {
    name, arguments: args
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
  return describe(`tool calls for ${elementType} with name "${elementName}"`, function() {

    (testOpenai && only ? it.only : it)('should return expected tool calls', inject(async function(bpmnFactory, refactorings) {

      // given
      const element = bpmnFactory.create(elementType, {
        name: elementName
      });

      const providers = refactorings.getProviders();

      expect(providers).to.have.length(1, 'Expected exactly one provider');

      const provider = providers[0];

      const tools = provider.getTools(element);

      const promises = [];

      // when
      for (let i = 0; i < totalRequests; i++) {
        promises.push(provider._openAIClient.getToolCalls(element, tools));
      }

      const results = await Promise.all(promises);
      const percentageSuccess = results.filter(result => toolCallsIsSubset(result, expected)).length / totalRequests * 100;
      const failed = percentageSuccess < expectedPercentage;
      console.log(`${failed ? '🔴' : '🟢'} ${elementType} "${elementName}" expects ${formatToolCalls(expected)}${failed ? ` but got ${results.map(formatToolCalls)}` : ''} (${totalRequests} requests)`);
      expect(failed, `Expected ${expectedPercentage}% of ${totalRequests} requests to succeed, but ${percentageSuccess}% succeeded`).to.be.false;
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
  return `[ ${toolCalls.map(({
    arguments: args = '{}', name
  }) => `${name}(${formatToolArguments(args)})`).join(', ')} ]`;
}

function formatToolArguments(args = {}) {
  if (!Object.keys(args).length) {
    return '';
  }

  return Object.entries(args).map(([ key, value ]) => `${key}: ${value}`).join(', ');
}


/**
 * Check whether subset is included in superset using string representations. True if both empty.
 *
 * @param {ToolCall[]} subset
 * @param {ToolCall[]} superset
 *
 * @returns {boolean}
 */
function toolCallsIsSubset(subset, superset) {
  const subsetSet = new Set(subset.map(toolCall => `${toolCall.name}(${JSON.stringify(toolCall.arguments)})`));
  const supersetSet = new Set(superset.map(toolCall => `${toolCall.name}(${JSON.stringify(toolCall.arguments)})`));
  for (let item of subsetSet) {
    if (!supersetSet.has(item)) {
      return false;
    }
  }

  return true;
}