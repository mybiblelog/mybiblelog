import { describe, it, expect } from 'vitest';
import { defaultLocaleBibleVersions } from '@mybiblelog/shared';
import { buildDefaultUserSettings } from '../repositories/helpers/user-settings';

describe('buildDefaultUserSettings', () => {
  it('falls back to the "en" locale when none is passed', () => {
    const settings = buildDefaultUserSettings();

    expect(settings.locale).toBe('en');
    expect(settings.preferredBibleVersion).toBe(defaultLocaleBibleVersions.en);
  });

  it('uses the given locale and its default Bible version when supported', () => {
    const settings = buildDefaultUserSettings('es');

    expect(settings.locale).toBe('es');
    expect(settings.preferredBibleVersion).toBe(defaultLocaleBibleVersions.es);
  });

  it('falls back to the "en" Bible version default for an unsupported locale', () => {
    const settings = buildDefaultUserSettings('xx');

    // Unrecognized locales are still stored as given, but the Bible version
    // has no matching entry, so it falls back to the "en" default.
    expect(settings.locale).toBe('xx');
    expect(settings.preferredBibleVersion).toBe(defaultLocaleBibleVersions.en);
  });
});
