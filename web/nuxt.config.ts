import { execSync } from 'node:child_process';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import type { Plugin } from 'vite';
import { locales as sharedLocales, getLocaleCodes } from '../shared/platform/i18n';

loadEnv({
  path: resolve(__dirname, '../.env'),
  quiet: true,
});

// The web app's version is the short git SHA it was built from. Heroku exposes
// the commit as SOURCE_VERSION during the build (and has no .git there); local
// builds fall back to git, then to 'dev'. Baked in at build time and sent as
// `X-App-Version` (see `app/plugins/http.ts`).
const resolveAppVersion = (): string => {
  if (process.env.SOURCE_VERSION) {
    return process.env.SOURCE_VERSION.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  }
  catch {
    return 'dev';
  }
};

// In `nuxt dev`, Nuxt's `nuxt:inlined-vue` plugin resolves the server's `vue`
// import to `vue.runtime.esm-bundler.js`, which vite-node then inlines. From
// Vue 3.6 that file also re-exports `@vue/runtime-vapor`, which needs
// runtime-core internals that only the bundler builds export, while vite-node
// still loads `@vue/runtime-dom`/`@vue/runtime-core` as Node's CJS builds. Every
// SSR request then fails with "createInternalObject is not a function".
// Server-compiled vapor SFCs only use the vdom SSR APIs, so resolve `vue` to
// Node's own entry: the build the production server already loads.
// `resolveId` is first-wins and Nuxt's plugin is also `enforce: 'pre'`, so the
// `vite:extendConfig` hook below puts this one at the front of the list.
// TECH-DEBT(nuxt-dev-ssr-vapor-runtime): remove once Nuxt's dev server stops
// inlining Vue's bundler build when vapor is enabled.
const devSsrNodeVue: Plugin = {
  name: 'mbl:dev-ssr-node-vue',
  enforce: 'pre',
  apply: 'serve',
  applyToEnvironment: environment => environment.config.consumer === 'server',
  resolveId: {
    filter: { id: /^vue$/ },
    handler: () => resolve(dirname(createRequire(import.meta.url).resolve('vue/package.json')), 'index.mjs'),
  },
};

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

  // Vue Vapor Mode (Vue 3.6+). Installs Vue's `vaporInteropPlugin` so SFCs
  // that opt in with `<script setup vapor>` render without a virtual DOM while
  // mixing freely with vdom components (Nuxt's built-ins, library components).
  // Components under app/components/ opt in; pages, layouts and app.vue stay
  // vdom: pages run async setup under <NuxtPage>'s <Suspense>, which vapor
  // components don't support. Vapor templates have no component proxy, so app
  // global properties (`$t`, `$terr`, `$route`, ...) don't resolve in them and
  // throw at runtime; bind them in setup instead (`useI18n()`, `useNuxtApp()`).
  vue: {
    vapor: true,
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
      locales: getLocaleCodes(),
      appVersion: resolveAppVersion(),
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
    locales: sharedLocales.map(({ code, name }) => ({ code, name })),
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
    // @nuxtjs/mdc (installed by @nuxt/content) adds a template nodeTransform,
    // `viteMDCSlot`, that reads `context.nodeTransforms` on every node. Vue's
    // vapor compiler context has no such field (it keeps them under
    // `context.options`), so every `<script setup vapor>` component fails to
    // compile with "Cannot read properties of undefined (reading '0')". Skip the
    // transform for vapor compiles: it only rewrites `<MDCSlot>` and
    // `<slot mdc-unwrap>`, which no component here uses (content markdown is
    // rendered by mdc's own vdom components, unaffected). This runs on
    // `vite:extendConfig`, which fires after mdc registers its transform on
    // `vite:extend`.
    // TECH-DEBT(mdc-vapor-node-transform): remove once @nuxtjs/mdc guards for
    // the vapor compiler context.
    'vite:extendConfig': (config) => {
      // See `devSsrNodeVue` above. The client and SSR passes share one plugin
      // list, so insert it once.
      const viteConfig = config as { plugins?: unknown[] };
      viteConfig.plugins ??= [];
      if (!viteConfig.plugins.includes(devSsrNodeVue)) {
        viteConfig.plugins.unshift(devSsrNodeVue);
      }

      const compilerOptions = (config as { vue?: { template?: { compilerOptions?: { nodeTransforms?: Array<(...args: never[]) => unknown> } } } })
        .vue?.template?.compilerOptions;
      const transforms = compilerOptions?.nodeTransforms;
      if (!transforms) { return; }
      compilerOptions.nodeTransforms = transforms.map((transform) => {
        if (transform.name !== 'viteMDCSlot') { return transform; }
        // Keep the name: the transform locates itself by it.
        const vaporSafe = {
          viteMDCSlot(node: unknown, context: { nodeTransforms?: unknown[] }) {
            if (!Array.isArray(context.nodeTransforms)) { return undefined; }
            return (transform as (...args: unknown[]) => unknown)(node, context);
          },
        }.viteMDCSlot;
        return vaporSafe as typeof transform;
      });
    },
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
    // TECH-DEBT(vite-pwa-dev-sw-route-markers): remove once @vite-pwa/nuxt relaxes its
    // `if (isServer) return` guard.
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

  // Exactly one copy of `vue` must be installed. With two (e.g. Nuxt requiring a
  // newer Vue than the hoisted one, so npm nests a second copy under nuxt/), the
  // Nitro trace splits them into .nitro/vue@x and leaves a top-level `vue/`
  // without index.mjs: every SSR route 500s with ERR_MODULE_NOT_FOUND, and with
  // `externalVue: false` Pinia lands on the other copy (`nuxtApp.$pinia`
  // undefined). Only the built server shows it; `nuxt dev` is unaffected. The
  // root package.json `overrides` keep vue/@vue/server-renderer on one version
  // — bump that range together with Nuxt's own `vue` requirement.
  //
  // Two 4.5 features are settled as "no":
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
    // compatibilityVersion 5 turns Nitro auto-imports off, and since Nuxt 4.6.2
    // that also strips them from `#imports` in the server bundle. @nuxtjs/i18n's
    // server runtime still imports `useRuntimeConfig` from `#imports`, so the
    // build fails without this (nuxt-modules/i18n#4175).
    // TECH-DEBT(nuxt-i18n-nitro-auto-imports): drop it once i18n imports from
    // `nitropack/runtime` instead.
    nitroAutoImports: true,
  },
});
