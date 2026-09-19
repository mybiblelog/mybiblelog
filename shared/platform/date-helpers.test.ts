import dayjs from 'dayjs';
import { describe, it, expect } from 'vitest';
import { getLocaleCodes } from './i18n';
import './date-helpers'; // ensures locale imports have run

describe('dayjs locale imports stay in sync with i18n locales', () => {
  it('has a dayjs locale import for every configured locale', () => {
    const configured = getLocaleCodes()
      .filter((code) => code !== 'en')
      .sort();
    const loaded = Object.keys(dayjs.Ls)
      .filter((code) => code !== 'en')
      .sort();
    expect(loaded).toEqual(configured);
  });
});
