/**
 * @typedef { {
 *   name: string;
 *   arguments: Object;
 * } } ToolCall
 */
import { isDefined } from 'min-dash';

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
 * @param {Object} [options] Options
 * @param {Function} [options.compareToolCalls] Custom comparison function
 * @param {number} [options.expectedPercentage=100] Percentage of requests that
 * must return expected
 * @param {number} [options.numberOfRequests=10] Number of requests to send,
 * defaults to process.env.TEST_OPENAI_REQUESTS or 10 tool calls
 * @param {boolean} [options.only=false] Run only this test
 */
export function expectToolCalls(elementType, elementName, expected, options = {}) {
  let {
    expectedPercentage = 100,
    numberOfRequests = 10,
    only = false,
    compareToolCalls = toolCallsEqual
  } = options;

  numberOfRequests = isDefined(process.env.TEST_OPENAI_REQUESTS) ? process.env.TEST_OPENAI_REQUESTS : numberOfRequests;

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
      for (let i = 0; i < numberOfRequests; i++) {
        promises.push(provider._openAIClient.getToolCalls(element, tools));
      }

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        const everyEqual = compareToolCalls(result, expected),
              someEqual = compareToolCalls(result, expected, true);

        const state = everyEqual ? '✅' : someEqual ? '⚠️' : '❌';

        console.log(`${ state } (${ index + 1 }/${ numberOfRequests }) Expected ${ formatToolCalls(expected) }, got ${ formatToolCalls(result) }`);
      });

      const actualPercentage = results.filter(result => compareToolCalls(result, expected, true)).length / numberOfRequests * 100;

      const failed = actualPercentage < expectedPercentage;

      console.log(`${ failed ? '❌' : '✅' } ${ elementType } "${ elementName }" expects ${ formatToolCalls(expected) }${ failed ? ` but got ${ results.map(formatToolCalls).join(', ') }` : ''} (${ numberOfRequests } requests)`);

      expect(failed, `Expected ${ expectedPercentage }% of ${ numberOfRequests } requests to succeed, but ${ actualPercentage }% succeeded`).to.be.false;
    }));
  });
}

expectToolCalls.only = function(elementType, elementName, expected, options = {}) {
  return expectToolCalls(elementType, elementName, expected, {
    ...options,
    only: true
  });
};

/**
 * Expect no tool calls for given element type and name. No tool calls includes
 * the fallback tool call if no other tool call is returned.
 *
 * @param {string} elementType Type of BPMN element
 * @param {string} elementName Name of BPMN element
 * @param {Object} [options] Options
 * @param {number} [options.expectedPercentage=100] Percentage of requests that
 * must return expected
 * @param {number} [options.numberOfRequests=10] Number of requests to send,
 * defaults to process.env.TEST_OPENAI_REQUESTS or 10 tool calls
 * @param {boolean} [options.only=false] Run only this test
 */
export function expectNoToolCalls(elementType, elementName, options = {}) {
  return expectToolCalls(elementType, elementName, [], {
    ...options,
    compareToolCalls: (result, _) => !result.length || result.length === 1 && result[ 0 ].name === FALLBACK_TOOL_NAME
  });
}

expectNoToolCalls.only = function(elementType, elementName, options = {}) {
  return expectNoToolCalls(elementType, elementName, {
    ...options,
    only: true
  });
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
 * Check whether tool calls are equal. Tool calls are equal if they have the
 * same name and arguments. The order of tool calls is not important.
 *
 * @param {ToolCall[]} actualToolCalls
 * @param {ToolCall[]} expectedToolCalls
 * @param {boolean} [some=false] Whether tool calls are equal if some tool calls
 * are equal
 *
 * @returns {boolean}
 */
function toolCallsEqual(actualToolCalls, expectedToolCalls, some = false) {
  if (some) {
    return actualToolCalls.some(actualToolCall => {
      return expectedToolCalls.some(expectedToolCall => {
        return toolCallEqual(actualToolCall, expectedToolCall);
      });
    });
  }

  if (actualToolCalls.length !== expectedToolCalls.length) {
    return false;
  }

  return actualToolCalls.every(actualToolCall => {
    return expectedToolCalls.some(expectedToolCall => {
      return toolCallEqual(actualToolCall, expectedToolCall);
    });
  });
}

/**
 * Check whether two tool calls are equal. Tool calls are equal if they have the
 * same name and arguments.
 *
 * @param {ToolCall} actualToolCall
 * @param {ToolCall} expectedToolCall
 *
 * @returns {boolean}
 */
function toolCallEqual(actualToolCall, expectedToolCall) {
  return actualToolCall.name === expectedToolCall.name
    && JSON.stringify(actualToolCall.arguments) === JSON.stringify(expectedToolCall.arguments);
}