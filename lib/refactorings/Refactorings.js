/**
 * @typedef {import('bpmn-js/lib/model/Types').Element} Element
 *
 * @typedef {{
 *   id: string;
 *   label: string;
 *   execute: (elements: Element[]) => void;
 * }} Refactoring
 *
 * @typedef {any} RefactoringProvider
 */

export default class Refactorings {
  constructor() {
    this._providers = [];
  }

  /**
   * Get refactorings for one or many elements.
   *
   * @param {Element[]} elements
   *
   * @returns {Refactoring[]}
   */
  async getRefactorings(elements) {
    const allRefactorings = [];

    for (const provider of this._providers) {
      const refactorings = await provider.getRefactorings(elements);

      if (refactorings) {
        allRefactorings.push(...refactorings);
      }
    }

    return allRefactorings;
  }

  /**
   * Register a refactoring provider.
   *
   * @param {RefactoringProvider} provider
   */
  registerProvider(provider) {
    this._providers.push(provider);
  }
}

Refactorings.$inject = [];