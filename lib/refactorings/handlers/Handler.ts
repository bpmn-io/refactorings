import type { Element } from 'bpmn-js/lib/model/Types';

export type FunctionDescription = {
  name: string;
  description: Object;
};

export type Refactoring = {
  name: string;
  arguments: any[];
};

export default interface Handler {
  getFunctionDescription(): FunctionDescription;
  execute(element: Element, refactoring: Refactoring): void;
  validate(element: Element, refactoring: Refactoring): boolean;
}