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
      googleAnalytics4MeasurementId: process.env.GA_MEASUREMENT_ID || '',
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
  ],

  content: {
    // Content directory at project root (nuxt4/content -> ../nuxt/content symlink)
    renderer: {
      anchorLinks: false,
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
    manifest: {
      name: 'My Bible Log',
      short_name: 'My Bible Log',
      lang: 'en',
      display: 'standalone',
      theme_color: '#0099FF',
    },
    workbox: {
      navigateFallback: null,
      globPatterns: [],
      runtimeCaching: [
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
