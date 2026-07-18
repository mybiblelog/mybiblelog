// Global test setup for the Nuxt 4 unit suite.
//
// Nuxt auto-imports Vue reactivity/lifecycle APIs and its own composables, so
// `<script setup>` source references `ref`, `computed`, `useI18n`, etc. with no
// import statements. `@vitejs/plugin-vue` does not add those imports, so we
// expose them as globals here. Nuxt composables get lightweight default stubs
// that individual tests can override with `vi.stubGlobal(...)`.
import { beforeEach, vi } from 'vitest';
import * as Vue from 'vue';
import { useClickOutside } from '~/composables/useClickOutside';
import { useEscapeKey } from '~/composables/useEscapeKey';
import { useSlideDrawerTransition } from '~/composables/useSlideDrawerTransition';

// --- Vue reactivity / lifecycle / helpers (stable; set once) ---
const vueGlobals = [
  'ref', 'computed', 'reactive', 'readonly', 'shallowRef', 'shallowReactive',
  'toRef', 'toRefs', 'toValue', 'unref', 'isRef', 'isReactive', 'markRaw', 'nextTick',
  'watch', 'watchEffect', 'watchPostEffect', 'watchSyncEffect',
  'onMounted', 'onBeforeMount', 'onBeforeUnmount', 'onUnmounted', 'onUpdated', 'onBeforeUpdate',
  'provide', 'inject', 'useSlots', 'useAttrs', 'defineComponent', 'h',
] as const;

for (const name of vueGlobals) {
  vi.stubGlobal(name, (Vue as unknown as Record<string, unknown>)[name]);
}

// --- Default Nuxt composable stubs (reinstalled fresh before each test) ---
function installNuxtDefaults() {
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    te: () => true,
    locale: Vue.ref('en'),
    locales: Vue.ref([]),
  }));

  vi.stubGlobal('useRuntimeConfig', () => ({
    public: {
      siteUrl: 'https://example.test',
      requireEmailVerification: true,
      googleAnalyticsId: '',
      locales: ['en', 'de', 'es', 'fr', 'ko', 'pt', 'uk'],
    },
  }));

  const makeHttp = () => ({
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  });

  vi.stubGlobal('useNuxtApp', () => ({
    $http: makeHttp(),
    $terr: (error: unknown) => String(error),
    $i18n: { locale: Vue.ref('en'), t: (key: string) => key },
  }));

  vi.stubGlobal('useLocalePath', () => (path: string) => path);
  vi.stubGlobal('useRoute', () => ({ query: {}, params: {}, path: '/', fullPath: '/' }));
  vi.stubGlobal('useRouter', () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
  vi.stubGlobal('navigateTo', vi.fn());
  vi.stubGlobal('createError', (input: unknown) => (input instanceof Error ? input : new Error(String(input))));
  vi.stubGlobal('useHead', vi.fn());
  vi.stubGlobal('useState', <T>(_key: string, init?: () => T) => Vue.ref(init ? init() : undefined));
  vi.stubGlobal('useCookie', () => Vue.ref(null));
  vi.stubGlobal('definePageMeta', vi.fn());
  vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn);
  vi.stubGlobal('useAsyncData', vi.fn().mockResolvedValue({ data: Vue.ref(null), pending: Vue.ref(false), error: Vue.ref(null), refresh: vi.fn() }));
  vi.stubGlobal('useFetch', vi.fn().mockResolvedValue({ data: Vue.ref(null), pending: Vue.ref(false), error: Vue.ref(null), refresh: vi.fn() }));
  vi.stubGlobal('useOpenInBible', () => ({
    openChapterInBible: vi.fn(),
    openPassageInBible: vi.fn(),
  }));

  // Real implementations (not mocks): these are plain composables with no
  // Nuxt-specific dependencies, so components under test get the genuine
  // outside-click/escape-key/drawer-transition behavior, same as at runtime
  // where Nuxt auto-imports them.
  vi.stubGlobal('useClickOutside', useClickOutside);
  vi.stubGlobal('useEscapeKey', useEscapeKey);
  vi.stubGlobal('useSlideDrawerTransition', useSlideDrawerTransition);
}

installNuxtDefaults();

beforeEach(() => {
  // Restore default composable stubs so a per-test override doesn't leak.
  installNuxtDefaults();
});
