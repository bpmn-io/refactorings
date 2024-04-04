/**
 * @typedef { {
 *   execute: (elements: Element[]) => void;
 *   id: string;
 *   label: string;
 * } } Refactoring
 */
import {
  isDefined,
  isNil
} from 'min-dash';

import { inject } from 'test/TestHelper';

const testOpenai = window.__env__ && window.__env__.TEST_OPENAI === 'true';

/**
 * Expect refactorings for given element type and name. By default, 10 requests
 * will be sent to OpenAI of which 100% must return the expected refactorings.
 *
 * @param {string} elementType Type of BPMN element
 * @param {string} elementName Name of BPMN element
 * @param {Refactoring[]} expected Expected refactorings
 * @param {Object} [options] Options
 * @param {number} [options.expectedPercentage=100] Percentage of requests that
 * must return expected
 * @param {number} [options.numberOfRequests=10] Number of requests to send,
 * defaults to process.env.OPENAI_TEST_REQUESTS or 10
 * @param {boolean} [options.only=false] Run only this test
 */
export function expectRefactorings(elementType, elementName, expected, options = {}) {
  let {
    expectedPercentage = 100,
    numberOfRequests = null,
    only = false
  } = options;

  if (isNil(numberOfRequests)) {
    numberOfRequests = isDefined(process.env.OPENAI_TEST_REQUESTS) ? process.env.OPENAI_TEST_REQUESTS : 10;
  }

  return describe(`refactorings for ${elementType} with name "${elementName}"`, function() {

    (testOpenai && only ? it.only : it)('should return expected refactorings', inject(async function(bpmnFactory, refactorings) {

      // given
      const element = bpmnFactory.create(elementType, {
        name: elementName
      });

      const providers = refactorings.getProviders();

      expect(providers).to.have.length(1, 'Expected exactly one provider');

      const provider = providers[0];

      const promises = [];

      // when
      console.log(`⏳ Sending ${ numberOfRequests } requests to OpenAI for ${ elementType } "${ elementName }"`);

      for (let i = 0; i < numberOfRequests; i++) {
        promises.push(provider.getRefactorings([ element ]));
      }

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        const everyEqual = refactoringsEqual(result, expected),
              someEqual = refactoringsEqual(result, expected, true);

        const state = everyEqual ? '✅' : someEqual ? '⚠️' : '❌';

        console.log(`${ state } (${ index + 1 }/${ numberOfRequests }) Expected ${ formatRefactorings(expected) }, got ${ formatRefactorings(result) }`);
      });

      const actualPercentage = results.filter(result => refactoringsEqual(result, expected, true)).length / numberOfRequests * 100;

      const failed = actualPercentage < expectedPercentage;

      console.log(`${ failed ? '❌' : '✅' } ${ elementType } "${ elementName }" expects ${ formatRefactorings(expected) }${ failed ? ` but got ${ results.map(formatRefactorings).join(', ') }` : ''} (${ numberOfRequests } requests)`);

      expect(failed, `Expected ${ expectedPercentage }% of ${ numberOfRequests } requests to succeed, but ${ actualPercentage }% succeeded`).to.be.false;
    }));
  });
}

expectRefactorings.only = function(elementType, elementName, expected, options = {}) {
  return expectRefactorings(elementType, elementName, expected, {
    ...options,
    only: true
  });
};

/**
 * Expect no refactorings for given element type and name.
 *
 * @param {string} elementType Type of BPMN element
 * @param {string} elementName Name of BPMN element
 * @param {Object} [options] Options
 * @param {number} [options.expectedPercentage=100] Percentage of requests that
 * must return expected
 * @param {number} [options.numberOfRequests=10] Number of requests to send,
 * defaults to process.env.OPENAI_TEST_REQUESTS or 10
 * @param {boolean} [options.only=false] Run only this test
 */
export function expectNoRefactorings(elementType, elementName, options = {}) {
  return expectRefactorings(elementType, elementName, [], options);
}

expectNoRefactorings.only = function(elementType, elementName, options = {}) {
  return expectNoRefactorings(elementType, elementName, {
    ...options,
    only: true
  });
};

function formatRefactorings(refactorings) {
  return `[ ${refactorings.map(({ id }) => id).join(', ')} ]`;
}

/**
 * Check whether refactorings are equal. The order of refactorings is not
 * important.
 *
 * @param {Refactoring[]} actualRefactorings
 * @param {Refactoring[]} expectedRefactorings
 * @param {boolean} [some=false] Whether refactorings are equal if some
 * refactorings are equal
 *
 * @returns {boolean}
 */
function refactoringsEqual(actualRefactorings, expectedRefactorings, some = false) {
  if (!actualRefactorings.length && !expectedRefactorings.length) {
    return true;
  }

  if (some) {
    return actualRefactorings.some(actualRefactoring => {
      return expectedRefactorings.some(expectedRefactoring => {
        return refactoringEqual(actualRefactoring, expectedRefactoring);
      });
    });
  }

  if (actualRefactorings.length !== expectedRefactorings.length) {
    return false;
  }

  return actualRefactorings.every(actualRefactoring => {
    return expectedRefactorings.some(expectedRefactoring => {
      return refactoringEqual(actualRefactoring, expectedRefactoring);
    });
  });
}

/**
 * Check whether two refactorings are equal. Refactorings are equal if they have
 * the same ID.
 *
 * @param {Refactoring} actualRefactoring
 * @param {Refactoring} expectedRefactoring
 *
 * @returns {boolean}
 */
function refactoringEqual(actualRefactoring, expectedRefactoring) {
  return actualRefactoring.id === expectedRefactoring.id;
}