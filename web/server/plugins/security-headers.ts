import { randomBytes } from 'node:crypto';
import { buildCsp, injectScriptNonce } from '../utils/security-headers';

// Security response headers for Nuxt-served pages (HTML documents, page JS/CSS).
// The API sets its own Helmet/CSP (api/app.ts) but that only covers /api/**
// responses proxied through Nitro — everything Nitro renders/serves directly
// (SSR HTML, @nuxt/content pages, the PWA manifest/service worker) had no
// CSP or hardening headers at all.
//
// CSP is skipped in dev, matching redirect-ssl.ts: Vite HMR and Nuxt devtools
// rely on inline/eval'd client code and websocket connections that a
// production-strength CSP would block, and there is no attacker-facing
// surface to protect on a local dev server.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event, response) => {
    setResponseHeaders(event, {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });

    if (import.meta.dev) {
      return;
    }

    const nonce = randomBytes(16).toString('base64');
    const contentType = getResponseHeader(event, 'content-type');
    const isHtml = typeof contentType === 'string' && contentType.includes('text/html');
    if (isHtml && typeof response.body === 'string') {
      response.body = injectScriptNonce(response.body, nonce);
    }

    setResponseHeaders(event, {
      'Content-Security-Policy': buildCsp(nonce),
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    });
  });
});
