module.exports = {
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    '../.eslintrc.js',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  // TypeScript specific rules
  rules: {
    // TypeScript handles unused vars, so disable the base rule
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    // Allow explicit any for flexibility in API code
    '@typescript-eslint/no-explicit-any': 'off',
    // This is backend + CLI code: console is the logging mechanism, so the rule
    // would only ever be suppressed line-by-line. Scope it off instead.
    'no-console': 'off',
  },
};
