import { describe, it, expect } from 'vitest';
import { resolvePassage, requirePassage, PassageError } from '../src/passages';

describe('resolvePassage', () => {
  it.each([
    ['JHN.3.16-18', 'JHN.3.16-18', 'John 3:16-18'],
    ['John 3:16-18', 'JHN.3.16-18', 'John 3:16-18'],
    ['Psalm 23', 'PSA.23', 'Psalms 23'],
    ['1 Corinthians 13:4-7', '1CO.13.4-7', '1 Corinthians 13:4-7'],
    ['gen 1:1-2:3', 'GEN.1.1-2.3', 'Genesis 1:1-2:3'],
    ['Obadiah', 'OBA', 'Obadiah'],
  ])('resolves %s', (text, usfm, display) => {
    const passage = resolvePassage(text);
    expect(passage?.usfm).toBe(usfm);
    expect(passage?.display).toBe(display);
  });

  it.each(['', 'xyz', 'Genesis 50 - Exodus 2', 'MAL.5', '3JN.1.15'])('rejects %j', (text) => {
    expect(resolvePassage(text)).toBeNull();
  });

  it('explains the accepted forms when a passage is not recognized', () => {
    expect(() => requirePassage('Hezekiah 4')).toThrow(PassageError);
    expect(() => requirePassage('Hezekiah 4')).toThrow(/USFM reference/);
  });
});
