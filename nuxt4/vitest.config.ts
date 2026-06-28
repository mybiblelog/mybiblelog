import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';

// Nuxt 4 SFCs use `<i18n lang="json">` custom blocks for inline translations.
// `@vitejs/plugin-vue` has no handler for that block and the test runner does not
// need real translations (tests stub `useI18n`), so strip the block from raw SFC
// source before the Vue compiler runs. Mirrors the `stripXmlTemplateLang` plugin
// in `nuxt/vitest.config.ts`.
const stripI18nBlock = {
  name: 'mbl-strip-i18n-block',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (id.endsWith('.vue') && code.includes('<i18n')) {
      return { code: code.replace(/<i18n[\s\S]*?<\/i18n>/g, ''), map: null };
    }
    return undefined;
  },
};

export default defineConfig({
  plugins: [stripI18nBlock, vue()],
  resolve: {
    alias: {
      // Nuxt config sets `srcDir: 'app/'`, so `~` and `@` resolve into app/.
      '~': resolve(__dirname, 'app'),
      '@': resolve(__dirname, 'app'),
      // Matches the alias in nuxt.config.ts so the workspace package resolves.
      '@mybiblelog/shared': resolve(__dirname, '../shared/index.ts'),
    },
    // Components/pages import siblings without a `.vue` extension, relying on
    // Nuxt/Vite resolution; mirror that for the test runner.
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  define: {
    // Nuxt inlines these; vitest does not. Default to the server branch so
    // client-only code paths (DOM/cookies/redirects) are skipped in unit tests.
    'import.meta.client': 'false',
    'import.meta.server': 'true',
  },
  // The project tsconfig extends `./.nuxt/tsconfig.json`, which only exists after
  // `nuxt prepare`. Give esbuild an explicit empty config so the test runner does
  // not try (and fail) to resolve that generated file.
  esbuild: {
    tsconfigRaw: '{}',
  },
  test: {
    // Default to `node`; component tests opt into a DOM via a
    // `// @vitest-environment happy-dom` docblock at the top of the file.
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    clearMocks: true,
  },
});
