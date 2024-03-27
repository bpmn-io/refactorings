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

    // TODO: parallelize requests by using Promise.all
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

  /**
   * Get all registered providers.
   *
   * @returns {RefactoringProvider[]}
   */
  getProviders() {
    return this._providers;
  }
}

Refactorings.$inject = [];