import { describe, it, expect } from 'vitest';
import { substitute } from '../services/email/locales/substitute';

/**
 * `substitute()` splices caller-supplied values into email HTML templates.
 * Every current template placeholder is a leaf value (plain text or a URL),
 * never a pre-built HTML fragment, so every interpolated value must be
 * HTML-escaped to prevent HTML/markup injection into outgoing emails.
 */
describe('substitute', () => {
  it('HTML-escapes interpolated values', () => {
    const result = substitute('Hello {{name}}', { name: '<script>alert(1)</script>' });
    expect(result).toBe('Hello &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('escapes ampersands, quotes, and angle brackets', () => {
    const result = substitute('{{value}}', { value: `Tom & "Jerry" <b>'s</b>` });
    expect(result).toBe('Tom &amp; &quot;Jerry&quot; &lt;b&gt;&#39;s&lt;/b&gt;');
  });

  it('leaves the surrounding template markup untouched', () => {
    const result = substitute('<a href="{{link}}">click</a>', { link: 'https://example.com/a?x=1&y=2' });
    // The ampersand within the interpolated URL is escaped (required for valid
    // HTML attribute content), but the template's own markup is preserved.
    expect(result).toBe('<a href="https://example.com/a?x=1&amp;y=2">click</a>');
  });

  it('substitutes multiple distinct placeholders independently', () => {
    const result = substitute('{{a}} and {{b}}', { a: '<i>a</i>', b: '<i>b</i>' });
    expect(result).toBe('&lt;i&gt;a&lt;/i&gt; and &lt;i&gt;b&lt;/i&gt;');
  });

  it('substitutes a missing key with an empty string', () => {
    const result = substitute('Hello {{name}}', {});
    expect(result).toBe('Hello ');
  });
});
