import path from 'node:path';
import dotenv from 'dotenv';
import redirectSSL from 'redirect-ssl';
import i18nConfig from './i18n.config';

import type { NuxtConfig } from '@nuxt/types';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
} as dotenv.DotenvConfigOptions);

const config: NuxtConfig = {
  components: true,
  // State management uses Pinia only.
  store: false,
  // Doc: https://nuxt.com/docs/4.x/bridge/configuration
  bridge: {
    typescript: true,
    capi: true,
    nitro: false,
  },
  modern: 'client',
  /*
  ** Headers of the page
  */
  head: {
    htmlAttrs: {
      lang: 'en',
    },
    titleTemplate: (titleChunk) => {
      const siteTitle = 'My Bible Log';
      if (titleChunk && titleChunk !== siteTitle) {
        if (titleChunk.includes(siteTitle)) {
          return titleChunk;
        }
        return `${titleChunk} | ${siteTitle}`;
      }
      return siteTitle;
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Track and gain insights on your Bible reading.' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    ],
  },
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },
  /*
  ** Customize Page Transition
  */
  pageTransition: {
    name: 'page',
    mode: 'out-in',
    duration: 100,
  },
  /*
  ** Global CSS
  */
  css: [
    '@/assets/css/main.css',
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    // Ensure `$http` is available before Pinia stores initialize.
    '~/plugins/http.ts',
    '~/plugins/pinia.ts',
    '~/plugins/app-init.server.ts',
    '~/plugins/gtag.client.ts',
    '~/plugins/translate-api.ts',
    '~/plugins/nuxt-client-init.client.ts',
  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    // Doc: https://typescript.nuxtjs.org/guide/introduction
    // This is needed to enable TypeScript support in Nuxt 2,
    // even beyond what Nuxt Bridge provides.
    '@nuxt/typescript-build',
    // Doc: https://pwa.nuxtjs.org/
    '@nuxtjs/pwa',
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://nuxt.com/modules/proxy
    '@nuxtjs/proxy',
    // Doc: https://www.npmjs.com/package/@nuxtjs/redirect-module
    '@nuxtjs/redirect-module',
    // Doc: https://content.nuxtjs.org/
    '@nuxt/content',
    // Doc: https://github.com/nuxt-community/robots-module#readme
    '@nuxtjs/robots',
    // Doc: https://i18n.nuxtjs.org/
    '@nuxtjs/i18n',
  ],
  i18n: i18nConfig,
  /*
  ** Proxy
  */
  proxy: {
    '/api': {
      target: process.env.API_BASE_URL || 'http://localhost:8080',
    },
  },
  redirect: [
    // The default locale was unintentionally removed from the i18n config,
    // so /en/ URLs may have been cached or indexed.
    // All /en/ URLs should be redirected to remove the locale prefix.
    { from: '^/en/(.*)$', to: '/$1' },
  ],
  robots: {
    Sitemap: `${process.env.SITE_URL}/api/sitemap.xml`,
    UserAgent: '*',
    Disallow: '',
  },
  /*
  ** Build configuration
  */
  build: {
    babel: {
      presets() {
        return [
          ['@nuxt/babel-preset-app', {
            targets: { esmodules: true },
            corejs: { version: 3 },
            useBuiltIns: 'usage',
          }],
        ];
      },
    },
    postcss: {
      postcssOptions: {
        plugins: {
          'postcss-mixins': {},
        },
      },
    },
    /*
    ** You can extend webpack config here
    */
    extend(config, _ctx) {
      // Ensure Pinia's ESM dependency (`vue-demi`) resolves correctly in Nuxt 2's
      // server build, which can otherwise prefer CJS entrypoints.
      if (config.resolve?.alias) {
        // Vue 2's CJS entrypoint doesn't support named ESM imports (e.g. `computed`).
        // Pinia + vue-demi expect ESM-style exports.
        // eslint-disable-next-line dot-notation
        config.resolve.alias['vue$'] = 'vue/dist/vue.runtime.esm.js';
        config.resolve.alias['vue-demi'] = 'vue-demi/lib/index.mjs';
      }
    },
  },
  serverMiddleware: [
    // Force HTTPS in production
    redirectSSL.create({
      enabled: (
        process.env.NODE_ENV === 'production' &&
        process.env.SITE_URL?.includes('https://')
      ),
    }),
  ],
  // New runtime config
  publicRuntimeConfig: {
    siteUrl: process.env.SITE_URL,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
    googleAnalytics4MeasurementId: process.env.GA_MEASUREMENT_ID,
    // We only use the LocaleObject type, but check for string to appease the type checker
    locales: i18nConfig.locales?.map(locale => typeof locale === 'string' ? locale : locale.code) || [],
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
      runtimeCaching: [
        {
          urlPattern: '.*',
          handler: 'networkFirst',
          method: 'GET',
          strategyOptions: {
            cacheName: 'my-bible-log-cache',
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
  },
  // Disable telemetry
  telemetry: false,
};

export default config;
