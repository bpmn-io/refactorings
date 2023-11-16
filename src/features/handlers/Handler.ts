import type { Element } from 'bpmn-js/lib/model/Types';

export type MetaData = {
  id: string;
  description: string;
};

export type Preview = {
  ok: () => void;
  cancel: () => void;
  elements: Element[];
};

export default interface Handler {
  getMetadata(): MetaData;
  preview(): Preview;
}