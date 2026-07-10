/**
 * Verifies that every non-English locale has the same dot-notation leaf keys as English for:
 * - Global messages in web/i18n/locales/locales.ts
 * - api/services/email/locales/strings.json (per locale)
 * - Each inline i18n JSON block in app/components, app/pages, and app/layouts (recursive .vue scan)
 *
 * Locales come from @mybiblelog/shared (same list as the app). Does not use web/i18n/locales/crowdin/
 * so CI works without running export-crowdin first.
 *
 * Usage: npm run i18n:verify-keys (runs via tsx)
 * Exit 1 on any mismatch.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// the web app is an ESM package ("type": "module"); @mybiblelog/shared is CJS that re-exports via
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

const { getLocaleCodes, defaultLocale } = shared;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const NUXT_ROOT = path.resolve(SCRIPT_DIR, '../..');

function flattenKeys(obj: unknown, prefix = ''): string[] {
  const keys: string[] = [];
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return keys;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, p));
    }
    else {
      keys.push(p);
    }
  }
  return keys.sort();
}

function compareMessages(
  baseLabel: string,
  en: unknown,
  other: unknown,
  locale: string,
): boolean {
  const ek = flattenKeys(en);
  const ok = flattenKeys(other);
  const es = new Set(ek);
  const os = new Set(ok);
  const missing = ek.filter(k => !os.has(k));
  const extra = ok.filter(k => !es.has(k));
  if (missing.length || extra.length) {
    console.error(`\n${baseLabel}`);
    if (missing.length) {
      console.error(`  Missing in ${locale}:`, missing.join(', '));
    }
    if (extra.length) {
      console.error(`  Extra in ${locale}:`, extra.join(', '));
    }
    return false;
  }
  return true;
}

function asMessageObject(v: unknown): Record<string, unknown> | null {
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

async function verifySfcTree(
  rootDir: string,
  kind: 'components' | 'pages' | 'layouts',
  otherLocales: string[],
): Promise<{ checked: number; ok: boolean }> {
  let checked = 0;
  let ok = true;
  for await (const file of walkVueFiles(rootDir)) {
    const src = await fs.readFile(file, 'utf8');
    if (isLegacySrcI18n(src)) {
      continue;
    }
    const body = findInlineI18nBody(src);
    if (!body) {
      continue;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = parseInlineI18nBlockJson(body, file);
    }
    catch (e) {
      console.error(e);
      ok = false;
      continue;
    }
    const enObj = asMessageObject(parsed[defaultLocale]);
    if (!enObj) {
      console.error(
        `\n${kind}/${toRelKey(file, rootDir)}.vue: missing or invalid "${defaultLocale}" message object in <i18n>`,
      );
      ok = false;
      continue;
    }
    checked += 1;
    const relLabel = `${kind}/${toRelKey(file, rootDir)}.vue`;
    for (const loc of otherLocales) {
      const otherObj = asMessageObject(parsed[loc]) ?? {};
      if (!compareMessages(`${relLabel} (${loc})`, enObj, otherObj, loc)) {
        ok = false;
      }
    }
  }
  return { checked, ok };
}

async function main() {
  const otherLocales = getLocaleCodes().filter(c => c !== defaultLocale).sort();
  let ok = true;

  const enMessages = globalLocales[defaultLocale];
  if (!enMessages) {
    console.error(`Missing default locale "${defaultLocale}" in web/i18n/locales/locales.ts`);
    process.exitCode = 1;
    return;
  }

  for (const locale of otherLocales) {
    const otherMessages = globalLocales[locale as keyof typeof globalLocales];
    if (otherMessages === undefined) {
      console.error(`\nMissing locale object for "${locale}" in web/i18n/locales/locales.ts`);
      ok = false;
      continue;
    }
    if (!compareMessages(`locales.ts en vs ${locale}`, enMessages, otherMessages, locale)) {
      ok = false;
    }
  }

  const emailPath = emailLocaleStringsPath(NUXT_ROOT);
  let emailRoot: unknown;
  try {
    emailRoot = JSON.parse(await fs.readFile(emailPath, 'utf8'));
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`\nFailed to read or parse email strings: ${emailPath}\n  ${msg}`);
    ok = false;
    emailRoot = null;
  }
  if (emailRoot !== null) {
    if (!isPlainObject(emailRoot)) {
      console.error(`\n${emailPath}: root must be a JSON object keyed by locale`);
      ok = false;
    }
    else {
      const enEmail = asMessageObject(emailRoot[defaultLocale]);
      if (!enEmail) {
        console.error(
          `\n${emailPath}: missing or invalid "${defaultLocale}" message object`,
        );
        ok = false;
      }
      else {
        for (const loc of otherLocales) {
          const otherEmail = asMessageObject(emailRoot[loc]) ?? {};
          if (!compareMessages(`email/strings.json en vs ${loc}`, enEmail, otherEmail, loc)) {
            ok = false;
          }
        }
      }
    }
  }

  const layoutsDir = path.join(NUXT_ROOT, 'app', 'layouts');
  const componentsDir = path.join(NUXT_ROOT, 'app', 'components');
  const pagesDir = path.join(NUXT_ROOT, 'app', 'pages');
  const r0 = await verifySfcTree(layoutsDir, 'layouts', otherLocales);
  const r1 = await verifySfcTree(componentsDir, 'components', otherLocales);
  const r2 = await verifySfcTree(pagesDir, 'pages', otherLocales);
  ok = ok && r0.ok && r1.ok && r2.ok;

  const sfcChecked = r0.checked + r1.checked + r2.checked;
  if (!ok) {
    process.exitCode = 1;
  }
  else {
    console.log(
      `OK: key parity en ↔ [${otherLocales.join(', ')}] (locales.ts + email/strings.json + ${sfcChecked} SFC file(s) with <i18n>).`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
