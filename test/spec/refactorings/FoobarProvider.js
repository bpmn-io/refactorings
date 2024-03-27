export default class FoobarProvider {
  constructor(refactorings) {
    refactorings.registerProvider(this);
  }

  /**
   * @param {Element[]} elements
   *
   * @returns {Refactoring[]}
   */
  getRefactorings(elements) {
    return [
      {
        id: 'foo',
        label: 'Foo',
        execute: () => {}
      },
      {
        id: 'bar',
        label: 'Bar',
        execute: () => {}
      },
      {
        id: 'baz',
        label: 'Baz',
        execute: () => {}
      }
    ];
  }
}

FoobarProvider.$inject = [ 'refactorings' ];