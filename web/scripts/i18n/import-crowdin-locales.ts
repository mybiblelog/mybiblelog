/**
 * Writes nuxt4/i18n/locales/locales.ts, api/services/email/locales/strings.json, and Vue <i18n> blocks
 * from nuxt4/i18n/locales/crowdin/<locale>.json
 * (typically after `crowdin download`). To push local translation edits to Crowdin instead,
 * run `i18n:export-crowdin` then `crowdin upload translations` (and `upload sources` when English changed).
 *
 * Usage: npm run i18n:import-crowdin
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// nuxt4 is an ESM package ("type": "module"); @mybiblelog/shared is CJS that re-exports via
// __exportStar, which Node's ESM named-export detection can't see. Import the default (module.exports).
import shared from '@mybiblelog/shared';
import {
  emailLocaleStringsPath,
  escapeIrregularWhitespace,
  findInlineI18nBodySpan,
  isLegacySrcI18n,
  isPlainObject,
  replaceInlineI18nBody,
} from './crowdin-bundle-shared';

const { getLocaleCodes } = shared;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const NUXT_ROOT = path.resolve(SCRIPT_DIR, '../..');
const CROWDIN_DIR = path.join(NUXT_ROOT, 'i18n', 'locales', 'crowdin');
const LOCALES_TS = path.join(NUXT_ROOT, 'i18n', 'locales', 'locales.ts');

type CrowdinBundle = {
  global: Record<string, unknown>;
  email: Record<string, unknown>;
  components: Record<string, Record<string, unknown>>;
  pages: Record<string, Record<string, unknown>>;
};

function quoteTsString(s: string): string {
  return `'${s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;
}

function tsIdentOrKey(k: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : quoteTsString(k);
}

/** Emit nested objects + strings only (matches Translation / SFC message trees). */
function valueToTsLiteral(val: unknown, depth: number): string {
  const pad = '  '.repeat(depth);
  const childPad = '  '.repeat(depth + 1);
  if (typeof val === 'string') {
    return quoteTsString(val);
  }
  if (!isPlainObject(val)) {
    throw new Error(`Cannot emit type ${typeof val} in locales.ts`);
  }
  const keys = Object.keys(val);
  if (keys.length === 0) {
    return '{}';
  }
  const lines = keys.map((k) => {
    return `${childPad}${tsIdentOrKey(k)}: ${valueToTsLiteral(val[k], depth + 1)},`;
  }).join('\n');
  return `{\n${lines}\n${pad}}`;
}

function buildLocalesTsFile(globalPerLocale: Record<string, unknown>): string {
  const body = valueToTsLiteral(globalPerLocale, 0);
  return `import type { Locales } from './locale.d';\n\nconst locales: Locales = ${body};\n\nexport default locales;\n`;
}

async function readBundle(locale: string, filePath: string): Promise<CrowdinBundle> {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  if (!isPlainObject(parsed)) {
    throw new Error(`${filePath}: root must be a JSON object`);
  }
  const g = parsed.global;
  const e = parsed.email;
  const c = parsed.components;
  const p = parsed.pages;
  if (!isPlainObject(g) || !isPlainObject(e) || !isPlainObject(c) || !isPlainObject(p)) {
    throw new Error(
      `${filePath}: expected keys "global", "email", "components", "pages" (objects)`,
    );
  }
  const components: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(c)) {
    components[k] = isPlainObject(v) ? v : {};
  }
  const pages: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(p)) {
    pages[k] = isPlainObject(v) ? v : {};
  }
  return {
    global: g,
    email: e,
    components,
    pages,
  };
}

async function writeEmailStringsFile(
  bundles: Record<string, CrowdinBundle>,
  localeCodes: string[],
): Promise<void> {
  const out: Record<string, unknown> = {};
  for (const loc of localeCodes) {
    out[loc] = bundles[loc].email;
  }
  const emailPath = emailLocaleStringsPath(NUXT_ROOT);
  await fs.writeFile(emailPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), emailPath)}`);
}

function keyToVueAbsPath(kind: 'components' | 'pages', key: string): string {
  const base = path.join(NUXT_ROOT, 'app', kind);
  return path.join(base, ...key.split('/')) + '.vue';
}

function collectAllKeys(bundles: Record<string, CrowdinBundle>, section: 'components' | 'pages'): Set<string> {
  const keys = new Set<string>();
  for (const b of Object.values(bundles)) {
    const o = b[section];
    for (const k of Object.keys(o)) {
      keys.add(k);
    }
  }
  return keys;
}

function getMessagesForKey(
  bundles: Record<string, CrowdinBundle>,
  locale: string,
  section: 'components' | 'pages',
  key: string,
): Record<string, unknown> {
  const part = bundles[locale][section][key];
  return isPlainObject(part) ? part : {};
}

async function applyVueSection(
  bundles: Record<string, CrowdinBundle>,
  localeCodes: string[],
  section: 'components' | 'pages',
): Promise<void> {
  const keys = collectAllKeys(bundles, section);
  for (const key of [...keys].sort((a, b) => a.localeCompare(b))) {
    const abs = keyToVueAbsPath(section, key);
    let src: string;
    try {
      src = await fs.readFile(abs, 'utf8');
    }
    catch {
      console.warn(`[import-crowdin] skip missing ${section} file: ${key} (${abs})`);
      continue;
    }
    if (isLegacySrcI18n(src)) {
      console.warn(`[import-crowdin] skip legacy src i18n: ${section}/${key}`);
      continue;
    }
    if (!findInlineI18nBodySpan(src)) {
      console.warn(`[import-crowdin] skip no inline <i18n> block: ${section}/${key}`);
      continue;
    }
    const merged: Record<string, Record<string, unknown>> = {};
    for (const loc of localeCodes) {
      merged[loc] = getMessagesForKey(bundles, loc, section, key);
    }
    const newBody = `\n${escapeIrregularWhitespace(JSON.stringify(merged, null, 2))}\n`;
    const updated = replaceInlineI18nBody(src, newBody);
    await fs.writeFile(abs, updated, 'utf8');
  }
}

async function main() {
  const localeCodes = getLocaleCodes();
  const missing: string[] = [];
  const bundles: Record<string, CrowdinBundle> = {};

  for (const loc of localeCodes) {
    const fp = path.join(CROWDIN_DIR, `${loc}.json`);
    try {
      await fs.access(fp);
    }
    catch {
      missing.push(fp);
      continue;
    }
    bundles[loc] = await readBundle(loc, fp);
  }

  if (missing.length > 0) {
    console.error('Missing Crowdin bundle file(s):');
    for (const m of missing) {
      console.error(`  ${m}`);
    }
    process.exitCode = 1;
    return;
  }

  const globalPerLocale: Record<string, unknown> = {};
  for (const loc of localeCodes) {
    globalPerLocale[loc] = bundles[loc].global;
  }

  await fs.writeFile(LOCALES_TS, buildLocalesTsFile(globalPerLocale), 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), LOCALES_TS)}`);

  await writeEmailStringsFile(bundles, localeCodes);

  await applyVueSection(bundles, localeCodes, 'components');
  await applyVueSection(bundles, localeCodes, 'pages');
  console.log('Updated Vue <i18n> blocks under components/ and pages/');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
