import { mergeConfig } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

// vitest.config.ts statically defines `import.meta.server: true` /
// `import.meta.client: false` so the default suite exercises server-rendered
// code paths (Vite's `define` is a literal textual substitution, so a single
// project can't flip these per test — see the comment there). `$http`'s
// session-expiry logout (app/plugins/http.ts) only runs behind
// `import.meta.client`, so it's untestable under the default project. This
// sibling config flips the two flags and is scoped to
// test/plugins/http-client.test.ts, which covers that client-only branch;
// every other test file keeps running under the default (server) config.
const merged = mergeConfig(baseConfig, defineConfig({
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
  },
}));

// `mergeConfig` concatenates array fields rather than replacing them, so
// merging `test.include`/`test.exclude` here would inherit the base config's
// `include: ['test/**/*.test.ts']` (running the whole suite a second time
// under flipped defines) and its `exclude` entry for this very file
// (excluding it from its own project). Set both directly instead, after the
// merge, so this project runs exactly and only this one file.
merged.test.include = ['test/plugins/http-client.test.ts'];
merged.test.exclude = [...configDefaults.exclude];

export default merged;
