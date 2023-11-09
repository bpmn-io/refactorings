export type MetaData = {
  id: string;
  description: string;
};

export default interface Handler {
  getMetadata(): MetaData;
  refactor(): void;
  preview(): Function;
}