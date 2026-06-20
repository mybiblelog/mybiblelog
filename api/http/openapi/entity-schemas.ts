import { z, type ZodType } from 'zod';
import { userSchema } from '../../validation/schemas/auth';
import { userSettingsSchema } from '../../validation/schemas/user-settings';
import { feedbackSchema } from '../../validation/schemas/feedback';
import { logEntrySchema } from '../../validation/schemas/log-entry';
import { passageNoteSchema, passageNoteSearchResultSchema } from '../../validation/schemas/passage-note';
import { passageNoteTagSchema } from '../../validation/schemas/passage-note-tag';
import { dailyReminderSchema } from '../../validation/schemas/daily-reminder';
import { clean } from './to-json-schema';

/**
 * The single, central definition of the API's entity schemas, exposed as named
 * OpenAPI components. Each entry is a serialized-response zod schema that already
 * acts as the source of truth for its handler's return type; documenting them
 * here (rather than as JSDoc in the Mongoose models) keeps the docs a projection
 * of the real contract.
 *
 * The schemas are registered with stable `id`s so the path generator can emit
 * `$ref`s to them — both when a response *is* an entity and when an entity is
 * nested inside a wrapper (e.g. `{ user: userSchema }`).
 */
const entitySchemasById: Record<string, ZodType> = {
  User: userSchema,
  UserSettings: userSettingsSchema,
  Feedback: feedbackSchema,
  LogEntry: logEntrySchema,
  PassageNote: passageNoteSchema,
  PassageNoteSearchResult: passageNoteSearchResultSchema,
  PassageNoteTag: passageNoteTagSchema,
  DailyReminder: dailyReminderSchema,
};

/** Registry the path generator consults to turn entity schemas into `$ref`s. */
export const openApiRegistry = z.registry<{ id: string }>();
for (const [id, schema] of Object.entries(entitySchemasById)) {
  openApiRegistry.add(schema, { id });
}

/**
 * The entity component schemas, keyed by component name. Cross-references
 * between entities (e.g. `PassageNoteSearchResult` -> `PassageNote`) resolve to
 * `#/components/schemas/...` via the `uri` mapping.
 */
export const entityComponentSchemas: Record<string, any> = (() => {
  const { schemas } = z.toJSONSchema(openApiRegistry, {
    io: 'output',
    uri: (id) => `#/components/schemas/${id}`,
  });
  return Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, clean(schema)]),
  );
})();
