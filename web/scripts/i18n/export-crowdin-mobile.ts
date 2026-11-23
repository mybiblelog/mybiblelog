/**
 * Writes one flat JSON per locale under web/i18n/locales/crowdin/mobile/ from mobile/src/i18n/<locale>.ts,
 * for the mobile Crowdin flow (crowdin.mobile.yml). Kept separate from the web bundle because the
 * Crowdin free plan can't host both string sets at once.
 *
 * Usage: npm run i18n:export-crowdin-mobile
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getLocaleCodes } from '@mybiblelog/shared';
import { isPlainObject, mobileCrowdinDir, mobileLocalesDir } from './crowdin-bundle-shared';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const NUXT_ROOT = path.resolve(SCRIPT_DIR, '../..');

// Imports each locale file directly; mobile/src/i18n/index.ts pulls in Expo native modules.
async function loadMobileLocale(locale: string): Promise<Record<string, string>> {
  const filePath = path.join(mobileLocalesDir(NUXT_ROOT), `${locale}.ts`);
  const mod = (await import(pathToFileURL(filePath).href)) as Record<string, unknown>;
  const table = mod[locale];
  if (!isPlainObject(table)) {
    throw new Error(`${filePath}: expected a named export "${locale}"`);
  }
  return table as Record<string, string>;
}

async function main() {
  const localeCodes = getLocaleCodes();
  const outDir = mobileCrowdinDir(NUXT_ROOT);
  await fs.mkdir(outDir, { recursive: true });
  for (const locale of localeCodes) {
    const table = await loadMobileLocale(locale);
    await fs.writeFile(path.join(outDir, `${locale}.json`), `${JSON.stringify(table, null, 2)}\n`, 'utf8');
  }
  console.log(`Wrote ${localeCodes.length} file(s) to ${path.relative(process.cwd(), outDir)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
