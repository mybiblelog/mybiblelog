// `tsconfig.json` extends `./.nuxt/tsconfig.json`, which Nuxt only generates via
// `nuxt prepare`. Vite's `@vitejs/plugin-vue` transform resolves the project
// tsconfig (via tsconfck) and throws when that base file is missing. The unit
// tests do not need the generated Nuxt types, so ensure a minimal stub exists
// before vitest starts. A real `nuxt prepare` output is never overwritten.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../.nuxt/tsconfig.json');

if (!existsSync(target)) {
  mkdirSync(resolve(here, '../.nuxt'), { recursive: true });
  writeFileSync(target, '{}\n');
}
