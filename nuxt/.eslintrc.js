module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  ignorePatterns: [
    '_translate.js', // plain JS file
    'static/sw.js', // Generated service worker file
  ],
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
  },
  overrides: [
    {
      // Build/CLI tooling (i18n import/export/verify): console is the output
      // mechanism, so scope the rule off rather than suppressing every line.
      files: ['scripts/**'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
