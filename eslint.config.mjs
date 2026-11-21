import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { core, style, typescript } from './eslint.base.mjs';

export default [
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  {
    // mobile/ has its own ESLint 9 flat config and Prettier, whose stylistic
    // choices conflict with these rules.
    ignores: ['mobile/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  core,
  style,
  typescript,
  {
    name: 'mbl/api',
    files: ['api/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // Backend + CLI code: console is the logging mechanism.
      'no-console': 'off',
    },
  },
  {
    name: 'mbl/scripts',
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // k6 load-test scripts run in k6's own JS runtime, not Node: they use k6
    // magic globals and follow k6's `function () {}` idiom.
    name: 'mbl/k6',
    files: ['scripts/load-test/**/*.js'],
    languageOptions: {
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
      },
    },
    rules: {
      '@stylistic/space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
    },
  },
];
