module.exports = {
  root: true,
  // mobile/ is a self-contained package with its own ESLint 9 flat config
  // (eslint.config.js), Prettier, and `expo lint` — this root config (ESLint 8,
  // eslintrc) can't read its flat config and its stylistic rules conflict with
  // mobile's Prettier (single vs double quotes, trailing commas). Leave mobile
  // to its own tooling.
  ignorePatterns: ['mobile/'],
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  // Shared custom rules for all JavaScript files
  rules: {
    indent: [
      'error',
      2,
    ],
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],
    semi: [
      'error',
      'always',
    ],
    'dot-notation': [
      'error',
    ],
    eqeqeq: [
      'error',
      'always',
    ],
    'no-magic-numbers': [
      'off',
    ],
    'eol-last': [
      'error',
      'always',
    ],
    'no-trailing-spaces': [
      'error',
    ],
    'object-property-newline': [
      'error',
      {
        allowMultiplePropertiesPerLine: true,
      },
    ],
    'block-spacing': [
      'error',
    ],
    'brace-style': [
      'error',
      'stroustrup',
      { allowSingleLine: true },
    ],
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    'space-before-blocks': [
      'error',
      'always',
    ],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    'space-infix-ops': [
      'error',
    ],
    'space-unary-ops': [
      'error',
      {
        words: true,
        nonwords: false,
      },
    ],
    'keyword-spacing': [
      'error',
    ],
    'key-spacing': [
      'error',
      {
        beforeColon: false,
        afterColon: true,
        mode: 'strict',
      },
    ],
    // Errors, not warnings: an unblocked warning never gets fixed and only
    // trains people to ignore lint output. Console is scoped off for backend
    // and scripts (see overrides below and in api/, nuxt/ configs), so this
    // only fires in client code, where a stray console shouldn't ship.
    'no-console': [
      'error',
    ],
    'no-var': [
      'error',
    ],
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        // TypeScript handles unused vars, so disable the base rule
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
      },
    },
  ],
};
