import { describe, it, expect } from 'vitest';
import render from '../services/email/email-templates/new-feedback-notification';

/**
 * `escapeHtml` is the only defense against HTML injection from free-text
 * feedback fields (kind/email/message are user-supplied). Assert that a
 * `<script>` tag and ampersand/quote characters land escaped in the rendered
 * html, for every interpolated field.
 */
describe('new-feedback-notification template', () => {
  it('escapes HTML-significant characters in kind, email, and message', () => {
    const { html } = render({
      adminFeedbackUrl: 'https://example.test/admin/feedback/123',
      kind: '<script>alert(1)</script>',
      email: 'a&b"c\'d@example.com',
      message: '<img src=x onerror=alert(1)> & "quoted" \'text\'',
    });

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('a&amp;b&quot;c&#39;d@example.com');
    expect(html).toContain(
      '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quoted&quot; &#39;text&#39;',
    );
  });
});
