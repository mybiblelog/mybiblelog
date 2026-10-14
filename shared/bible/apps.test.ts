import { describe, expect, it } from 'vitest';
import { BibleApps, BibleVersions, getAppReadingUrl } from './apps';

describe('getAppReadingUrl - Logos (ref.ly)', () => {
  // Book indices: Romans = 45, 1 Corinthians = 46, Song of Songs = 22.
  it('builds a ref.ly URL with the version suffix', () => {
    const url = getAppReadingUrl(BibleApps.LOGOS, BibleVersions.NIV, 45, 8);
    expect(url).toBe('https://ref.ly/Romans%208;NIV');
  });

  it('space-encodes numbered book names', () => {
    const url = getAppReadingUrl(BibleApps.LOGOS, BibleVersions.ESV, 46, 15);
    expect(url).toBe('https://ref.ly/1%20Corinthians%2015;ESV');
  });

  it('space-encodes multi-word book names', () => {
    const url = getAppReadingUrl(BibleApps.LOGOS, BibleVersions.NIV, 22, 2);
    expect(url).toBe('https://ref.ly/Song%20of%20Songs%202;NIV');
  });

  it('maps the internal version key to the Logos code', () => {
    const url = getAppReadingUrl(BibleApps.LOGOS, BibleVersions.NASB1995, 45, 8);
    expect(url).toBe('https://ref.ly/Romans%208;NASB95');
  });

  it('falls back to the default version code for an unknown version key', () => {
    const url = getAppReadingUrl(BibleApps.LOGOS, 'BOGUS' as keyof typeof BibleVersions, 45, 8);
    // default version is NASB2020 -> Logos code 'NASB'
    expect(url).toBe('https://ref.ly/Romans%208;NASB');
  });
});

describe('getAppReadingUrl - YouVersion App', () => {
  it('builds a youversion:// deep link', () => {
    const url = getAppReadingUrl(BibleApps.YOUVERSIONAPP, BibleVersions.NIV, 45, 8);
    expect(url).toBe('youversion://bible?reference=ROM.8.NIV');
  });

  it('falls back to the default version for an unknown version key', () => {
    const url = getAppReadingUrl(BibleApps.YOUVERSIONAPP, 'BOGUS' as keyof typeof BibleVersions, 1, 1);
    // default version is NASB2020
    expect(url).toBe('youversion://bible?reference=GEN.1.NASB2020');
  });
});

describe('getAppReadingUrl - Bible.com', () => {
  it('builds a bible.com URL with version id and code', () => {
    const url = getAppReadingUrl(BibleApps.BIBLECOM, BibleVersions.NIV, 45, 8);
    expect(url).toBe('https://www.bible.com/bible/111/ROM.8.NIV');
  });

  it('falls back to the default version for an unknown version key', () => {
    const url = getAppReadingUrl(BibleApps.BIBLECOM, 'BOGUS' as keyof typeof BibleVersions, 1, 1);
    expect(url).toBe('https://www.bible.com/bible/2692/GEN.1.NASB2020');
  });
});

describe('getAppReadingUrl - Blue Letter Bible', () => {
  it('builds a blueletterbible.org URL', () => {
    const url = getAppReadingUrl(BibleApps.BLUELETTERBIBLE, BibleVersions.NIV, 45, 8);
    expect(url).toBe('https://www.blueletterbible.org/niv/Rom/8/1');
  });

  it('falls back to the default version code for an unknown version key', () => {
    const url = getAppReadingUrl(BibleApps.BLUELETTERBIBLE, 'BOGUS' as keyof typeof BibleVersions, 1, 1);
    expect(url).toBe('https://www.blueletterbible.org/nasb20/Gen/1/1');
  });
});

describe('getAppReadingUrl - Bible Gateway (default)', () => {
  it('builds a biblegateway.com URL', () => {
    const url = getAppReadingUrl(BibleApps.BIBLEGATEWAY, BibleVersions.NIV, 45, 8);
    expect(url).toBe('https://www.biblegateway.com/passage/?version=NIV&search=Romans%208');
  });

  it('falls back to the default version code for an unknown version key', () => {
    const url = getAppReadingUrl(BibleApps.BIBLEGATEWAY, 'BOGUS' as keyof typeof BibleVersions, 1, 1);
    // default version is NASB2020 -> Bible Gateway code 'NASB'
    expect(url).toBe('https://www.biblegateway.com/passage/?version=NASB&search=Genesis%201');
  });

  it('falls back to Bible Gateway for an unrecognized app key', () => {
    const url = getAppReadingUrl('BOGUS' as keyof typeof BibleApps, BibleVersions.NIV, 45, 8);
    expect(url).toBe('https://www.biblegateway.com/passage/?version=NIV&search=Romans%208');
  });
});

describe('getAppReadingUrl - Olive Tree', () => {
  it('builds an olivetree:// deep link', () => {
    const url = getAppReadingUrl(BibleApps.OLIVETREE, BibleVersions.NIV, 45, 8);
    expect(url).toBe('olivetree://bible/45.8.1');
  });
});
