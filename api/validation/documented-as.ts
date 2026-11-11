import { type z, type ZodType } from 'zod';

/**
 * Stand-in schemas for the generated OpenAPI docs. zod cannot render the
 * accepted input of some schemas (a `preprocess` shows only what it produces),
 * so such a schema names another one to be documented as. Registering it here,
 * next to the validating schema, lets routes keep documenting the schema their
 * handler really validates with.
 */
const standIns = new WeakMap<z.core.$ZodType, ZodType>();

export const documentAs = <T extends ZodType>(schema: T, standIn: ZodType): T => {
  standIns.set(schema, standIn);
  return schema;
};

export const documentedAs = (schema: z.core.$ZodType): ZodType | undefined => standIns.get(schema);
