import dayjs from 'dayjs';
import { defaultLocaleBibleVersions } from '@mybiblelog/shared';
import { UserSettingsDocument } from '../../mongo/documents';

/**
 * Builds a user's default settings document. Replaces the per-field `default`
 * functions that lived on the Mongoose `UserSettings` schema; the repository
 * applies these explicitly when creating a user.
 */
export const buildDefaultUserSettings = (locale?: string): UserSettingsDocument => {
  const resolvedLocale = locale || 'en';
  return {
    dailyVerseCountGoal: 86,
    lookBackDate: dayjs().format('YYYY-MM-DD'),
    preferredBibleVersion: defaultLocaleBibleVersions[resolvedLocale] ?? defaultLocaleBibleVersions.en,
    startPage: 'start',
    passageNoteTagSortOrder: 'label:ascending',
    locale: resolvedLocale,
  };
};
