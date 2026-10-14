import { describe, expect, it, test } from 'vitest';
import {
  bibleVersions,
  defaultLocaleBibleVersions,
  isBibleVersionKey,
  localeVersionGroups,
} from './translations';
import type { LocaleCode } from '../platform/i18n';

test('isBibleVersionKey returns true for a known key', () => {
  expect(isBibleVersionKey('KJV')).toBe(true);
});

test('isBibleVersionKey returns false for an unrelated string', () => {
  expect(isBibleVersionKey('NOT_A_VERSION')).toBe(false);
});

test('isBibleVersionKey returns false for inherited Object.prototype property names', () => {
  expect(isBibleVersionKey('toString')).toBe(false);
  expect(isBibleVersionKey('constructor')).toBe(false);
});

describe('localeVersionGroups', () => {
  it('has a non-empty array for every locale used in defaultLocaleBibleVersions', () => {
    const locales = Object.keys(defaultLocaleBibleVersions) as LocaleCode[];
    locales.forEach((locale) => {
      expect(localeVersionGroups[locale]).toBeDefined();
      expect(localeVersionGroups[locale].length).toBeGreaterThan(0);
    });
  });

  it('groups each version key under its declared locale', () => {
    Object.entries(bibleVersions).forEach(([key, def]) => {
      expect(localeVersionGroups[def.locale]).toContain(key);
    });
  });
});
