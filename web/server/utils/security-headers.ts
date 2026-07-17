// Pure helpers for server/plugins/security-headers.ts, split out so they can
// be unit tested without a running Nitro instance (defineNitroPlugin and the
// h3 auto-imports the plugin itself relies on aren't available under plain
// vitest).

export const buildCsp = (nonce: string): string => [
  "default-src 'self'",
  // Vue's :style bindings and Nuxt's SSR critical-CSS block compile to
  // inline style attributes/tags at runtime — that content is never
  // attacker-controlled, so 'unsafe-inline' is an acceptable trade-off
  // here (mirrors api/app.ts's Helmet config).
  "style-src 'self' 'unsafe-inline'",
  // The 'unsafe-inline' fallback is ignored by any browser that honors the
  // nonce; it only serves browsers old enough not to support CSP3 nonces.
  `script-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  // Service worker registration (@vite-pwa/nuxt) falls back to default-src
  // per spec, but Safari/older browsers honor an explicit worker-src.
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "media-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join('; ');

// Nuxt's SSR renderer always emits one bare `<script>window.__NUXT__=...`
// hydration-payload tag with no `src`/`type` attribute (see
// renderPayloadJsonScript in Nuxt's nitro renderer) and this Nuxt version
// has no built-in nonce support for it, so it's patched in here rather than
// widening the CSP to a blanket 'unsafe-inline'.
const INLINE_SCRIPT_OPEN_TAG = /<script(?![^>]*\bsrc=)(?![^>]*\btype=)>/g;

export const injectScriptNonce = (html: string, nonce: string): string =>
  html.replace(INLINE_SCRIPT_OPEN_TAG, `<script nonce="${nonce}">`);
