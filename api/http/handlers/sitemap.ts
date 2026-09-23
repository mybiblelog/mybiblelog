import fs from 'node:fs';
import path from 'node:path';
import xml from 'xml';
import { locales } from '@mybiblelog/shared';
import { getConfig } from '../../config';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic sitemap handler.
 *
 * The sitemap is a public, non-JSON endpoint: it enumerates the localized site
 * URLs (top-level content pages such as the homepage/FAQ/android-app, generated
 * /about pages, and the printable reading tracker page and PDFs) and returns the result
 * as an XML string via `HttpResult.raw`, bypassing the standard JSON envelope.
 * It needs no auth or repositories.
 */

const siteLocales = locales.map((locale) => locale.code);

// Resolve the repo root from __dirname rather than process.cwd(): the API can
// be started with cwd api/ (standalone server.ts) or the repo root (the
// single-process launcher). Same src-vs-dist distinction as api/config/index.ts
// — compiled output lives one level deeper (api/dist/http/handlers).
const repoRoot = __dirname.includes('dist') ?
  path.resolve(__dirname, '../../../..') :
  path.resolve(__dirname, '../../..');

// Reads a `dateModified: "YYYY-MM-DD"` frontmatter field for <lastmod>. Pages
// without one get no <lastmod> at all: stamping every URL with today's date
// teaches crawlers to ignore the field entirely.
const readDateModified = (filePath: string): string | undefined => {
  const source = fs.readFileSync(filePath, 'utf8');
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  return frontmatter.match(/^dateModified:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1];
};

type SitemapEntry = { url: string; lastmod?: string };

// GET /sitemap.xml - Localized sitemap in XML format
export const getSitemap: RouteHandler = async () => {
  const entries: SitemapEntry[] = [];

  // iterate through the top-level *.md files inside each /content/{locale} directory
  // (index.md -> homepage, everything else -> /{slug}); about/ and policy/ are
  // subdirectories so they're naturally excluded by the isFile() filter, and
  // policy/ pages are intentionally excluded from the sitemap (they're noindex)
  for (const locale of siteLocales) {
    const localePrefix = locale === 'en' ? '' : `/${locale}`;

    const localeContentDir = path.resolve(repoRoot, 'web', 'content', locale);
    const topLevelFiles = fs.readdirSync(localeContentDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

    for (const file of topLevelFiles) {
      const slug = file.name.replace('.md', '');
      const url = slug === 'index' ? localePrefix : `${localePrefix}/${slug}`;
      entries.push({ url, lastmod: readDateModified(path.join(localeContentDir, file.name)) });
    }
  }

  // iterate through the /about directory inside each /content/{locale} directory
  for (const locale of siteLocales) {
    const localePrefix = locale === 'en' ? '' : `/${locale}`;

    const aboutDir = path.resolve(repoRoot, 'web', 'content', locale, 'about');
    const aboutPageFiles = fs.readdirSync(aboutDir);
    for (const file of aboutPageFiles) {
      const slug = file.replace('.md', '');
      const url = `${localePrefix}/about/${slug}`;
      entries.push({ url, lastmod: readDateModified(path.join(aboutDir, file)) });
    }
  }

  // Vue-rendered (non-markdown) public pages, which the content scans above can't discover
  for (const locale of siteLocales) {
    const localePrefix = locale === 'en' ? '' : `/${locale}`;
    entries.push({ url: `${localePrefix}/resources/printable-bible-reading-tracker` });
  }

  // add the printable reading tracker PDF of each locale
  const pdfUrls = [
    // these are static files that have non-locale-specific URLs
    '/downloads/druckbare-bibel-lesetrack.pdf',
    '/downloads/printable-bible-reading-tracker.pdf',
    '/downloads/rastreador-de-lectura-de-la-biblia-imprimible.pdf',
    '/downloads/feuille-de-suivi-de-lecture-de-la-Bible-imprimable.pdf',
    '/downloads/drukovanyy-vidstezhuvach-chytannya-bibliyi.pdf',
    '/downloads/rastreador-de-leitura-da-biblia-para-imprimir.pdf',
    '/downloads/인쇄용 성경 읽기 추적표.pdf',
  ];
  entries.push(...pdfUrls.map((url) => ({ url })));

  const sitemapItems = entries.map(({ url, lastmod }) => ({
    url: [
      // encodeURI: <loc> must be a valid URL (the Korean PDF name has spaces and non-ASCII)
      { loc: encodeURI(getConfig().siteUrl + url) },
      ...(lastmod ? [{ lastmod }] : []),
      { changefreq: 'monthly' },
      { priority: 0.8 },
    ],
  }));

  const sitemapObject = {
    urlset: [
      {
        _attr: {
          xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        },
      },
      ...sitemapItems,
    ],
  };

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>${xml(sitemapObject)}`;

  return { status: 200, raw: { contentType: 'application/xml', body: sitemap } };
};
