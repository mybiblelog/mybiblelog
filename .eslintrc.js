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
      // k6 load-test scripts run in k6's own JS runtime, not Node: they use k6
      // magic globals (__ENV/__VU/__ITER), import from `k6/*`, log to the k6
      // console, and follow k6's `function () {}` idiom (space before parens on
      // anonymous scenario functions).
      files: ['scripts/load-test/**/*.js'],
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
      },
      rules: {
        'no-console': 'off',
        'space-before-function-paren': [
          'error',
          {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always',
          },
        ],
      },
    },
    {
      // Server launcher scripts: ESM with top-level await (needs 2022), and
      // console logging is their only output channel.
      files: ['scripts/*.mjs'],
      parserOptions: {
        ecmaVersion: 2022,
      },
      rules: {
        'no-console': 'off',
      },
    },
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
