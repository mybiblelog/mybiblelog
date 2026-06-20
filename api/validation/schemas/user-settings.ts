import { z } from 'zod';
import dayjs from 'dayjs';
import { BibleVersions, getLocaleCodes } from '@mybiblelog/shared';
import { StartPages, PassageNoteTagSortOrders } from '../constants';

const bibleVersionKeys = Object.keys(BibleVersions);
const localeCodes = getLocaleCodes();

export const userSettingsBaseSchema = z.object({
  dailyVerseCountGoal: z.number().min(1).max(1111),
  lookBackDate: z.string().refine((value) => dayjs(value, 'YYYY-MM-DD', true).isValid()),
  preferredBibleVersion: z.string().refine((value) => bibleVersionKeys.includes(value)),
  startPage: z.string().refine((value) => (StartPages as readonly string[]).includes(value)),
  passageNoteTagSortOrder: z.string().refine((value) => (PassageNoteTagSortOrders as readonly string[]).includes(value)),
  locale: z.string().refine((value) => (localeCodes as readonly string[]).includes(value)),
});

/** Settings updates accept any subset of the settings fields. */
export const userSettingsPatchSchema = userSettingsBaseSchema.partial();

export type UserSettingsPatch = z.infer<typeof userSettingsPatchSchema>;

/** Body for `PUT /settings` — a `settings` object holding the patch. */
export const settingsUpdateBodySchema = z.object({
  settings: userSettingsPatchSchema,
});
