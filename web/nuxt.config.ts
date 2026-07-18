import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({
  path: resolve(__dirname, '../.env'),
  quiet: true,
});

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  // All app source files live in app/
  srcDir: 'app/',

  // Global CSS
  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      'postcss-mixins': {},
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

  // API proxy: forward /api/* to the Express backend
  nitro: {
    routeRules: {
      '/api/**': {
        proxy: `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/**`,
      },
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
      { code: 'es', iso: 'es-ES', name: 'Español' },
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

  // Enable AsyncLocalStorage for SSR context propagation across concurrent requests.
  // Without this, useNuxtApp() calls inside async store actions fail when multiple
  // requests run concurrently (Playwright fullyParallel) because the synchronous
  // unctx context stack is a shared global that gets corrupted across async boundaries.
  experimental: {
    asyncContext: true,
  },
});
