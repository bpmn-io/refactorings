import type { Element } from 'bpmn-js/lib/model/Types';

export type FunctionDescription = {
  name: string;
  description: Object;
};

export type Preview = {
  ok: () => void;
  cancel: () => void;
  elements: Element[];
};

export type Refactoring = {
  name: string;
  arguments: any[];
};

export default interface Handler {
  getFunctionDescription(): FunctionDescription;
  preview(element: Element, refactoring: Refactoring): Preview;
  validate(element: Element, refactoring: Refactoring) : boolean;
}