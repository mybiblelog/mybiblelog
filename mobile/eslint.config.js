// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Test files and the jest setup use jest-idiomatic patterns that conflict
    // with a few stylistic rules: mock factories must precede the imports they
    // affect (`jest.mock` is hoisted), factories use `require`, and inline mock
    // components have no display name.
    files: ['**/*.test.{ts,tsx}', 'jest.setup.ts'],
    rules: {
      'import/first': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react/display-name': 'off',
    },
  },
]);
