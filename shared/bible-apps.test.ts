import { describe, expect, it } from 'vitest';
import { BibleApps, BibleVersions, getAppReadingUrl } from './bible-apps';

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
