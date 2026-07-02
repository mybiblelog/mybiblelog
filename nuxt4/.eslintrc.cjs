module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  ignorePatterns: [
    '.nuxt/**', // Nuxt build output
    '.output/**', // Nuxt build output
    '.data/**', // Local dev database
    'content/**', // Symlink to ../nuxt/content
    'public/**', // Symlink to ../nuxt/static
  ],
  // Nuxt 4 auto-imports these at build time, so they are not explicitly
  // imported in source. Declare them as readonly globals so `no-undef`
  // does not flag them. (Project stores/composables are explicitly imported.)
  globals: {
    // Vue reactivity / lifecycle
    ref: 'readonly',
    computed: 'readonly',
    reactive: 'readonly',
    watch: 'readonly',
    watchEffect: 'readonly',
    nextTick: 'readonly',
    toRef: 'readonly',
    toRefs: 'readonly',
    onMounted: 'readonly',
    onBeforeMount: 'readonly',
    onBeforeUnmount: 'readonly',
    onUnmounted: 'readonly',
    onBeforeUpdate: 'readonly',
    onUpdated: 'readonly',
    getCurrentInstance: 'readonly',
    // Nuxt app composables
    useNuxtApp: 'readonly',
    useRuntimeConfig: 'readonly',
    useState: 'readonly',
    useHead: 'readonly',
    useSeoMeta: 'readonly',
    useRoute: 'readonly',
    useRouter: 'readonly',
    useAsyncData: 'readonly',
    useLazyAsyncData: 'readonly',
    useFetch: 'readonly',
    useError: 'readonly',
    useCookie: 'readonly',
    useRequestHeaders: 'readonly',
    navigateTo: 'readonly',
    createError: 'readonly',
    definePageMeta: 'readonly',
    defineNuxtPlugin: 'readonly',
    defineNuxtRouteMiddleware: 'readonly',
    $fetch: 'readonly',
    // @nuxtjs/i18n
    useI18n: 'readonly',
    useLocalePath: 'readonly',
    useSwitchLocalePath: 'readonly',
    // @nuxt/content
    queryCollection: 'readonly',
    useContentSeo: 'readonly',
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    '../.eslintrc.js',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
      },
    },
  },
  // Nuxt/TypeScript specific rules
  rules: {
    // Disable problematic import rules that conflict with TypeScript resolver
    'import/namespace': 'off',
    'import/named': 'off',
    'import/default': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-duplicates': 'off',
    'import/order': 'off',
    // Allow CJS in config files (needed for .eslintrc.js itself)
    'nuxt/no-cjs-in-config': 'off',
    // TypeScript handles unused vars, so disable the base rule
    'no-unused-vars': 'off',
    // Enforce kebab-case component names
    'vue/component-name-in-template-casing': ['error', 'kebab-case',
      {
        registeredComponentsOnly: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': 'error',
    // The base rule misreports inline generic type params
    // (`<T>(p: string) => Promise<T>`) as use-before-define, treating the type
    // parameter `T` as a variable. TypeScript already catches genuine
    // use-before-define for values, so disable this lint rule.
    'no-use-before-define': 'off',
    // These components target Vue 3, which supports fragments (multiple root
    // nodes) and `:key` on `<template v-for>`. The base config ships the Vue 2
    // variants of these rules, which are invalid for Vue 3.
    'vue/no-multiple-template-root': 'off',
    'vue/no-v-for-template-key': 'off',
    // Permit `void expr;` as a statement to mark intentionally-unawaited
    // promises (used in store tests to fire-and-forget a save).
    'no-void': ['error', { allowAsStatement: true }],
  },
};
