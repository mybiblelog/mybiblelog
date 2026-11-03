import { z } from 'zod';
import dayjs from 'dayjs';
import { BibleVersions, getLocaleCodes } from '@mybiblelog/shared';
import { StartPages, PassageNoteTagSortOrders } from '../constants';

const bibleVersionKeys = Object.keys(BibleVersions);
const localeCodes = getLocaleCodes();

export const userSettingsBaseSchema = z.object({
  dailyVerseCountGoal: z.number().min(1).max(1111).describe('Number of verses the user aims to read each day (1–1111)'),
  lookBackDate: z.string().refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid())
    .describe('YYYY-MM-DD date from which reading progress is counted'),
  preferredBibleVersion: z.string().refine((value) => bibleVersionKeys.includes(value))
    .describe(`Bible translation used for reading links: one of ${bibleVersionKeys.join(', ')}`),
  startPage: z.string().refine((value) => (StartPages as readonly string[]).includes(value))
    .describe(`Page shown after sign-in: one of ${StartPages.join(', ')}`),
  passageNoteTagSortOrder: z.string().refine((value) => (PassageNoteTagSortOrders as readonly string[]).includes(value))
    .describe(`How tags are sorted: one of ${PassageNoteTagSortOrders.join(', ')}`),
  locale: z.string().refine((value) => (localeCodes as readonly string[]).includes(value))
    .describe(`UI locale code: one of ${localeCodes.join(', ')}`),
});

/** Settings updates accept any subset of the settings fields. */
export const userSettingsPatchSchema = userSettingsBaseSchema.partial();

export type UserSettingsPatch = z.infer<typeof userSettingsPatchSchema>;

/** Body for `PUT /settings` — a `settings` object holding the patch. */
export const settingsUpdateBodySchema = z.object({
  settings: userSettingsPatchSchema.describe('The settings to change; omitted fields keep their values'),
}).describe('A partial update of the user\'s settings.');

/**
 * The serialized shape of a user's settings as returned by the API. A stored
 * settings record always carries every field, so this reuses the (non-partial)
 * base schema; it is the single source of truth for the generated OpenAPI docs.
 */
export const userSettingsSchema = userSettingsBaseSchema;
