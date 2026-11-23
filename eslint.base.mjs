import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

const unusedVarsOptions = {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
};

export const core = {
  name: 'mbl/core',
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },
  rules: {
    'dot-notation': 'error',
    eqeqeq: ['error', 'always'],
    // Errors, not warnings: an unblocked warning never gets fixed and only
    // trains people to ignore lint output. Console is scoped off for backend
    // and scripts, so this only fires in client code, where a stray console
    // shouldn't ship.
    'no-console': 'error',
    'no-var': 'error',
    'no-unused-vars': ['error', unusedVarsOptions],
  },
};

export const style = {
  name: 'mbl/style',
  plugins: {
    '@stylistic': stylistic,
  },
  rules: {
    '@stylistic/indent': ['error', 2, { SwitchCase: 0 }],
    '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
    '@stylistic/semi': ['error', 'always'],
    '@stylistic/eol-last': ['error', 'always'],
    '@stylistic/no-trailing-spaces': 'error',
    '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    '@stylistic/block-spacing': 'error',
    '@stylistic/brace-style': ['error', 'stroustrup', { allowSingleLine: true }],
    '@stylistic/comma-dangle': ['error', 'always-multiline'],
    '@stylistic/space-before-blocks': ['error', 'always'],
    '@stylistic/space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],
    '@stylistic/space-infix-ops': 'error',
    '@stylistic/space-unary-ops': ['error', { words: true, nonwords: false }],
    '@stylistic/keyword-spacing': 'error',
    '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true, mode: 'strict' }],
    '@stylistic/object-curly-newline': ['error', { ImportDeclaration: { multiline: true }, ExportDeclaration: { multiline: true } }],
    '@stylistic/object-curly-spacing': ['error', 'always'],
  },
};

export const typescript = {
  name: 'mbl/typescript',
  // typescript-eslint's recommended set also runs on JS files, so give every
  // file the same single unused-vars rule.
  files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', unusedVarsOptions],
  },
};
