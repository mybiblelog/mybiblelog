import { describe, it, expect } from 'vitest';
import { linkifyText } from './linkify';

describe('linkifyText', () => {
  it('returns plain text untouched', () => {
    expect(linkifyText('hello')).toEqual([{ type: 'text', text: 'hello' }]);
    expect(linkifyText('')).toEqual([]);
  });

  it('extracts a link and trims trailing punctuation', () => {
    expect(linkifyText('See https://example.com/a?b=1, ok')).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'link', text: 'https://example.com/a?b=1', url: 'https://example.com/a?b=1' },
      { type: 'text', text: ', ok' },
    ]);
  });

  it('keeps balanced parens but drops an unbalanced closer', () => {
    expect(linkifyText('(https://x.com/a)')[1]).toMatchObject({ url: 'https://x.com/a' });
    expect(linkifyText('https://x.com/a_(b)')[0]).toMatchObject({ url: 'https://x.com/a_(b)' });
  });

  it('ignores non-http schemes and bare scheme', () => {
    expect(linkifyText('javascript:alert(1) https://')).toEqual([
      { type: 'text', text: 'javascript:alert(1) https://' },
    ]);
  });

  it('handles multiple links and newlines', () => {
    const segs = linkifyText('http://a.com\nhttps://b.com');
    expect(segs.filter((s) => s.type === 'link')).toHaveLength(2);
  });
});
