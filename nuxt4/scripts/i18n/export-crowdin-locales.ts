/**
 * Builds one merged JSON per locale under nuxt4/i18n/locales/crowdin/ for Crowdin CLI uploads.
 * Sources: nuxt4/i18n/locales/locales.ts (global) + api/services/email/locales/strings.json (email) +
 * inline <i18n lang="json"> in app/components and app/pages.
 *
 * After editing strings in the repo, run this before:
 *   - crowdin upload sources (English / source copy)
 *   - crowdin upload translations (non-English bundles, after local fixes in locales.ts or Vue)
 *
 * Usage: npm run i18n:export-crowdin
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// nuxt4 is an ESM package ("type": "module"); @mybiblelog/shared is CJS that re-exports via
// __exportStar, which Node's ESM named-export detection can't see. Import the default (module.exports).
import shared from '@mybiblelog/shared';
import globalLocales from '../../i18n/locales/locales';
import {
  emailLocaleStringsPath,
  findInlineI18nBody,
  isLegacySrcI18n,
  isPlainObject,
  parseInlineI18nBlockJson,
  toRelKey,
  walkVueFiles,
} from './crowdin-bundle-shared';

const { getLocaleCodes } = shared;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const NUXT_ROOT = path.resolve(SCRIPT_DIR, '../..');

type ParsedSfc = Record<string, unknown>;

async function collectSfcBlocks(
  rootDir: string,
): Promise<Map<string, ParsedSfc>> {
  const byFile = new Map<string, ParsedSfc>();
  for await (const file of walkVueFiles(rootDir)) {
    const src = await fs.readFile(file, 'utf8');
    if (isLegacySrcI18n(src)) {
      continue;
    }
    const body = findInlineI18nBody(src);
    if (!body) {
      continue;
    }
    const parsed = parseInlineI18nBlockJson(body, file);
    byFile.set(toRelKey(file, rootDir), parsed);
  }
  return byFile;
}

function messagesForLocale(
  parsed: ParsedSfc,
  locale: string,
): Record<string, unknown> {
  const msg = parsed[locale];
  if (msg === undefined) {
    return {};
  }
  if (msg === null || typeof msg !== 'object' || Array.isArray(msg)) {
    return {};
  }
  return msg as Record<string, unknown>;
}

function sortRecordKeys<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T;
  for (const k of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    (out as Record<string, unknown>)[k] = obj[k];
  }
  return out;
}

async function loadEmailStringsRoot(filePath: string): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  if (!isPlainObject(parsed)) {
    throw new Error(`${filePath}: expected JSON object keyed by locale codes`);
  }
  return parsed;
}

async function main() {
  const localeCodes = getLocaleCodes();
  const componentsDir = path.join(NUXT_ROOT, 'app', 'components');
  const pagesDir = path.join(NUXT_ROOT, 'app', 'pages');
  const outDir = path.join(NUXT_ROOT, 'i18n', 'locales', 'crowdin');

  const componentBlocks = await collectSfcBlocks(componentsDir);
  const pageBlocks = await collectSfcBlocks(pagesDir);

  const emailStringsPath = emailLocaleStringsPath(NUXT_ROOT);
  const emailRoot = await loadEmailStringsRoot(emailStringsPath);

  await fs.mkdir(outDir, { recursive: true });

  for (const locale of localeCodes) {
    const globalMsg = globalLocales[locale as keyof typeof globalLocales];
    if (!globalMsg) {
      throw new Error(`Missing global locale "${locale}" in locales/locales.ts`);
    }

    const components: Record<string, Record<string, unknown>> = {};
    for (const [relKey, parsed] of componentBlocks) {
      components[relKey] = messagesForLocale(parsed, locale);
    }

    const pages: Record<string, Record<string, unknown>> = {};
    for (const [relKey, parsed] of pageBlocks) {
      pages[relKey] = messagesForLocale(parsed, locale);
    }

    const emailRaw = emailRoot[locale];
    const emailMsg = isPlainObject(emailRaw) ? emailRaw : {};

    const bundle = {
      global: structuredClone(globalMsg) as Record<string, unknown>,
      email: structuredClone(emailMsg) as Record<string, unknown>,
      components: sortRecordKeys(components),
      pages: sortRecordKeys(pages),
    };

    const outPath = path.join(outDir, `${locale}.json`);
    await fs.writeFile(outPath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
  }

  const relOut = path.relative(process.cwd(), outDir);
  console.log(`Wrote ${localeCodes.length} file(s) to ${relOut}/`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
