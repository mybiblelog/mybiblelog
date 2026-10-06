import { describe, it, expect } from 'vitest';
import { Bible, locales } from '@mybiblelog/shared';
import bibleBookGuides from '~/helpers/bible-book-guides';
import { formatKeyPassage, loadBookOverviews } from '~/helpers/bible-book-content';

const overviewFiles = import.meta.glob('../../app/helpers/bible-book-overviews/*.ts');

describe('bible book content', () => {
  it('has guide data for every book', () => {
    expect(bibleBookGuides).toHaveLength(Bible.getBookCount());
    bibleBookGuides.forEach((guide) => {
      expect(guide.keyPassages.length).toBeGreaterThan(0);
    });
  });

  it.each(locales.map(locale => locale.code))('has 66 non-empty overviews for %s', async (code) => {
    // loadBookOverviews falls back to English, so check the locale's own file exists
    expect(Object.keys(overviewFiles)).toContain(`../../app/helpers/bible-book-overviews/${code}.ts`);
    const overviews = await loadBookOverviews(code);
    expect(overviews).toHaveLength(Bible.getBookCount());
    overviews.forEach((overview, i) => {
      expect(overview.trim().length, `${code} book ${i + 1}`).toBeGreaterThan(40);
    });
  });

  it('falls back to English for an unknown locale', async () => {
    expect(await loadBookOverviews('xx')).toEqual(await loadBookOverviews('en'));
  });

  it('formats key passages with localized book names', () => {
    expect(formatKeyPassage(1, '1:1–2:3', 'en')).toBe('Genesis 1:1–2:3');
    expect(formatKeyPassage(19, '23', 'en')).toBe('Psalm 23');
    expect(formatKeyPassage(19, '23', 'de')).toBe('Psalm 23');
    expect(formatKeyPassage(43, '3:16', 'ko')).toBe(`${Bible.getBookName(43, 'ko')} 3:16`);
  });
});
