import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({
  path: resolve(__dirname, '../.env'),
  quiet: true,
});

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 5,
  },

  // All app source files live in app/
  srcDir: 'app/',

  // Global CSS
  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      'postcss-mixins': { mixinsDir: resolve(__dirname, 'app/assets/css/mixins') },
    },
  },

  // Page transitions matching the original app
  app: {
    pageTransition: { name: 'page', mode: 'out-in', duration: 100 },
  },

  // Runtime config — public values are exposed to the client
  runtimeConfig: {
    public: {
      siteUrl: process.env.SITE_URL || '',
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
      locales: ['en', 'de', 'es', 'fr', 'ko', 'pt', 'uk'],
    },
  },

  // API proxy: forward /api/* to the Express backend. External /api requests
  // never reach Nitro in the single-process production topology (the launcher
  // dispatches them straight to the Express app), but SSR-internal fetches of
  // '/api/**' route through Nitro's internal router and DO hit this rule — the
  // launcher keeps a loopback Express listener on API_PORT as its target. The
  // same rule also serves the legacy two-process topology
  // (`npm run start:legacy`), so rollback is just a script flip.
  nitro: {
    routeRules: {
      '/api/**': {
        proxy: `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/**`,
      },
    },
  },

  // Production builds export a request handler (node-listener) instead of a
  // self-listening server, so the launcher can serve web + api on one port.
  // node-listener doesn't enable static asset serving (unlike node-server,
  // which sets it in the preset) — without serveStatic, /_nuxt/* falls through
  // to the SSR renderer and 404s.
  $production: {
    nitro: {
      preset: 'node-listener',
      serveStatic: true,
    },
  },

  alias: {
    '@mybiblelog/shared': resolve(__dirname, '../shared/index.ts'),
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/content',
    '@vite-pwa/nuxt',
    'nuxt-gtag',
  ],

  content: {
    // Content directory at project root (web/content)
    renderer: {
      anchorLinks: false,
    },
  },

  // Empty id no-ops (no script injected, no CSP widening needed) — see
  // server/utils/security-headers.ts's `analyticsEnabled` flag, which reads
  // this same id off runtimeConfig.public.gtag.
  gtag: {
    id: process.env.GA_MEASUREMENT_ID || '',
    // Page views are sent manually — see app/plugins/analytics.client.ts.
    config: {
      send_page_view: false,
    },
  },

  i18n: {
    baseUrl: process.env.SITE_URL,
    locales: [
      { code: 'en', iso: 'en-US', name: 'English' },
      { code: 'de', iso: 'de-DE', name: 'Deutsch' },
      { code: 'es', iso: 'es-419', name: 'Español' },
      { code: 'fr', iso: 'fr-FR', name: 'Français' },
      { code: 'ko', iso: 'ko-KR', name: '한국어' },
      { code: 'pt', iso: 'pt-BR', name: 'Português' },
      { code: 'uk', iso: 'uk-UA', name: 'українська' },
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      alwaysRedirect: true,
      redirectOn: 'root',
    },
  },

  pwa: {
    // 'prompt' keeps needRefresh pending until the user clicks Reload in the
    // PwaPrompt component, rather than silently reloading on every SW update.
    registerType: 'prompt',
    // Generate the icon set (192/512/maskable/apple-touch) from public/icon.png
    // via pwa-assets.config.ts, and auto-inject manifest icons + apple head links.
    pwaAssets: {
      config: true,
    },
    manifest: {
      name: 'My Bible Log',
      short_name: 'My Bible Log',
      lang: 'en',
      display: 'standalone',
      start_url: '/?standalone=true',
      background_color: '#ffffff',
      theme_color: '#0099FF',
    },
    // Enables $pwa.showInstallPrompt / $pwa.install() for the install button.
    client: {
      installPrompt: true,
    },
    // Serve the manifest + a (minimal) service worker in `nuxt dev` so the PWA
    // is testable without a production build. The production workbox
    // runtimeCaching below does not apply to the dev SW.
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      type: 'module',
    },
    workbox: {
      navigateFallback: null,
      globPatterns: [],
      runtimeCaching: [
        // Workbox matches these in order and stops at the first hit, so this
        // must precede the catch-all below: API responses carry per-user data
        // (auth/session, notes, settings) and must never land in Cache
        // Storage, or a signed-out shared device could still read them.
        // Same-origin RegExp routes are tested against the full `url.href`
        // (unanchored), so this doesn't need a leading `^` — see
        // workbox-routing's RegExpRoute.
        {
          urlPattern: /\/api\//,
          handler: 'NetworkOnly',
        },
        {
          urlPattern: /^https?:\/\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'my-bible-log-cache',
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
  },

  hooks: {
    // Re-register @vite-pwa/nuxt's dev-server route markers. The module pushes them
    // only when `vite:serverCreated` fires with `isServer: false`, but
    // `experimental.viteEnvironmentApi` (on by default at compatibilityVersion 5)
    // collapses the client and SSR Vite servers into one and fires the hook a single
    // time with `isServer: true`, so all of them are skipped. Without a marker, Nuxt's
    // Vite dev handler classifies the URL as a non-Vite route and diverts it past the
    // transform middleware — and the dev worker, its workbox runtime, and the
    // suppress-warnings stub are all virtual modules that only the transform middleware
    // can serve, so `nuxt dev` registers no service worker at all. The handlers are
    // never invoked (Connect matches on the pathname, and /dev-sw.js carries a query
    // string) — only their presence in the stack matters. Production is unaffected: the
    // built worker is a real /sw.js asset.
    // Remove once @vite-pwa/nuxt relaxes its `if (isServer) return` guard.
    'vite:serverCreated': (viteServer) => {
      // app.baseURL is the default '/'; Vite's own `base` is /_nuxt/ in dev, so it
      // cannot be used here.
      const routes = [
        '/manifest.webmanifest',
        '/dev-sw.js?dev-sw',
        '/workbox-',
        '/suppress-warnings.js',
      ];
      for (const route of routes) {
        if (viteServer.middlewares.stack.some(layer => layer.route === route)) { continue; }
        viteServer.middlewares.stack.push({
          route,
          handle: (_req: IncomingMessage, _res: ServerResponse, next: () => void) => next(),
        });
      }
    },
  },

  vite: {
    // Pre-bundle CJS deps discovered at runtime to avoid dev-server page reloads
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'dayjs',
        'dayjs/locale/de',
        'dayjs/locale/es',
        'dayjs/locale/fr',
        'dayjs/locale/ko',
        'dayjs/locale/pt',
        'dayjs/locale/uk',
        'dayjs/plugin/duration',
        'dayjs/plugin/relativeTime',
        'dayjs/plugin/weekday',
        'workbox-window',
      ],
    },
    build: {
      // modulepreload is supported by 96%+ of browsers; polyfill not worth the
      // sourcemap warning it generates in Vite 7
      modulePreload: { polyfill: false },
    },
  },

  // Disable telemetry
  telemetry: false,

  // Held at Nuxt 4.4.x deliberately: 4.5.x cannot produce a working production
  // build for this app. `experimental.externalVue` defaults to true in 4.5, but
  // the Nitro trace only copies the `vue/server-renderer` subpath — the bare
  // `vue` import in the renderer chunk resolves to an uncopied `vue/index.mjs`,
  // so every SSR route 500s with ERR_MODULE_NOT_FOUND. Setting externalVue:false
  // fixes that and trades into a second 500 (`nuxtApp.$pinia` is undefined in
  // @pinia/nuxt's `app:rendered` hook). Both reproduce on the node-server preset
  // and are independent of the Pinia major and of `asyncContext`; `nuxt dev` is
  // unaffected, so only the built server shows it. Re-test on the next 4.5.x.
  //
  // Two 4.5 features are also settled as "no", independent of the above:
  //
  // `experimental.ssrStreaming` — streaming commits status and headers with the
  // first byte, which breaks server/plugins/security-headers.ts: it generates the
  // CSP nonce and rewrites `response.body` in `beforeResponse`, long after those
  // bytes are gone. Un-nonced hydration scripts would then be blocked outright,
  // since nonce-aware browsers ignore the `'unsafe-inline'` fallback. Content
  // pages also redirect (index.vue) and throw 404s ([slug].vue) after an await,
  // neither of which can reach the client mid-stream — and crawlers, the audience
  // those pages exist for, are excluded from streaming anyway.
  //
  // `builder: 'rspack'` — @vite-pwa/nuxt wraps vite-plugin-pwa and is Vite-only,
  // so switching builders silently drops the manifest and service worker.
  experimental: {
    // Enable AsyncLocalStorage for SSR context propagation across concurrent requests.
    // Without this, useNuxtApp() calls inside async store actions fail when multiple
    // requests run concurrently (Playwright fullyParallel) because the synchronous
    // unctx context stack is a shared global that gets corrupted across async boundaries.
    asyncContext: true,
  },
});
