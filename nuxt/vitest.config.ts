import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue2';

// The SVG components in `components/svg/` declare `<template lang="xml">`, which
// vue-loader accepts under webpack but @vitejs/plugin-vue2 cannot preprocess.
// Strip the lang attribute from raw SFC source before the Vue compiler runs so
// these presentational leaves don't break test compilation.
const stripXmlTemplateLang = {
  name: 'mbl-strip-xml-template-lang',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (id.endsWith('.vue') && code.includes('<template lang="xml">')) {
      return { code: code.replace('<template lang="xml">', '<template>'), map: null };
    }
    return undefined;
  },
};

export default defineConfig({
  plugins: [stripXmlTemplateLang, vue()],
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
      '@': resolve(__dirname, '.'),
    },
    // These pages/components import siblings without a `.vue` extension,
    // relying on Nuxt/webpack resolution; mirror that for the test runner.
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  test: {
    // Default to `node`; component/page tests opt into a DOM via a
    // `// @vitest-environment happy-dom` docblock at the top of the file.
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
