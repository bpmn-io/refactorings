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
        execute: (elements) => {
          console.log('Foo', elements);
        }
      },
      {
        id: 'bar',
        label: 'Bar',
        execute: (elements) => {
          console.log('Bar', elements);
        }
      },
      {
        id: 'baz',
        label: 'Baz',
        execute: (elements) => {
          console.log('Baz', elements);
        }
      }
    ];
  }
}

FoobarProvider.$inject = [ 'refactorings' ];