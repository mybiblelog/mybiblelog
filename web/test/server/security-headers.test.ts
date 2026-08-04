import { describe, it, expect } from 'vitest';
import { buildCsp, injectScriptNonce } from '../../server/utils/security-headers';

describe('buildCsp', () => {
  it('embeds the given nonce in script-src alongside self and unsafe-inline', () => {
    const csp = buildCsp('abc123');
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'unsafe-inline'");
  });

  // @nuxt/content runs SQLite-WASM in the browser for client-side navigation.
  it('allows WebAssembly compilation without allowing JavaScript eval', () => {
    const csp = buildCsp('abc123');
    expect(csp).toContain("'wasm-unsafe-eval'");
    expect(csp).not.toMatch(/(?<!wasm-)unsafe-eval/);
  });

  it('locks down framing and plugins', () => {
    const csp = buildCsp('abc123');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it('omits GA4 hosts when analytics is disabled', () => {
    const csp = buildCsp('abc123');
    expect(csp).not.toContain('googletagmanager.com');
    expect(csp).not.toContain('google-analytics.com');
  });

  it('allows the GA4 script and beacon hosts when analytics is enabled', () => {
    const csp = buildCsp('abc123', true);
    expect(csp).toContain(
      "script-src 'self' 'nonce-abc123' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com",
    );
    expect(csp).toContain('connect-src \'self\' https://www.google-analytics.com https://www.googletagmanager.com');
  });
});

describe('injectScriptNonce', () => {
  it('adds the nonce to a bare inline <script> tag', () => {
    const html = '<head></head><body><script>window.__NUXT__={}</script></body>';
    expect(injectScriptNonce(html, 'the-nonce')).toBe(
      '<head></head><body><script nonce="the-nonce">window.__NUXT__={}</script></body>',
    );
  });

  it('does not touch scripts that already have a src attribute', () => {
    const html = '<script type="module" src="/_nuxt/app.js" crossorigin></script>';
    expect(injectScriptNonce(html, 'the-nonce')).toBe(html);
  });

  it('does not touch scripts that already have a type attribute', () => {
    const html = '<script type="application/json" id="__NUXT_DATA__">[]</script>';
    expect(injectScriptNonce(html, 'the-nonce')).toBe(html);
  });

  it('leaves html with no inline scripts unchanged', () => {
    const html = '<div>no scripts here</div>';
    expect(injectScriptNonce(html, 'the-nonce')).toBe(html);
  });
});
