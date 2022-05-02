import { Bson } from "../../deps.ts";
import { schemaFns } from "../../models/schema.ts";

export const addOutrelation = (
  schemaName: string,
  doc: Bson.Document,
  schema: Record<string, any>,
) => {
  let outRelation = {};

  for (const key in schema.outrelation) {
    outRelation = {
      ...outRelation,
      [key]: [],
    };
  }

  doc = Object.assign(outRelation, doc);

  return doc;
};