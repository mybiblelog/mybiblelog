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
 * URLs (homepages, FAQ pages, generated /about pages, and the printable reading
 * tracker PDFs) and returns the result as an XML string via `HttpResult.raw`,
 * bypassing the standard JSON envelope. It needs no auth or repositories.
 */

const siteLocales = locales.map((locale) => locale.code);

// GET /sitemap.xml - Localized sitemap in XML format
export const getSitemap: RouteHandler = async () => {
  const relativeUrls: string[] = [];

  // start with the homepage of each locale
  for (const locale of siteLocales) {
    // English (default locale) has no prefix
    const url = locale === 'en' ? '' : `/${locale}`;
    relativeUrls.push(url);
  }

  // add the FAQ page of each locale
  for (const locale of siteLocales) {
    const localePrefix = locale === 'en' ? '' : `/${locale}`;
    const url = `${localePrefix}/faq`;
    relativeUrls.push(url);
  }

  // iterate through the /about directory inside each /content/{locale} directory
  for (const locale of siteLocales) {
    const localePrefix = locale === 'en' ? '' : `/${locale}`;

    const aboutDir = path.resolve(process.cwd(), '..', 'nuxt', 'content', locale, 'about');
    const aboutPageFiles = fs.readdirSync(aboutDir);
    for (const file of aboutPageFiles) {
      const slug = file.replace('.md', '');
      const url = `${localePrefix}/about/${slug}`;
      relativeUrls.push(url);
    }
  }

  // add the printable reading tracker PDF of each locale
  relativeUrls.push(
    // these are static files that have non-locale-specific URLs
    '/downloads/druckbare-bibel-lesetrack.pdf',
    '/downloads/printable-bible-reading-tracker.pdf',
    '/downloads/rastreador-de-lectura-de-la-biblia-imprimible.pdf',
    '/downloads/feuille-de-suivi-de-lecture-de-la-Bible-imprimable.pdf',
    '/downloads/drukovanyy-vidstezhuvach-chytannya-bibliyi.pdf',
    '/downloads/rastreador-de-leitura-da-biblia-para-imprimir.pdf',
    '/downloads/인쇄용 성경 읽기 추적표.pdf',
  );

  const urls = relativeUrls.map((url) => getConfig().siteUrl + url);

  const sitemapItems = urls.map((url) => ({
    url: [
      { loc: url },
      { lastmod: new Date().toISOString().split('T')[0] },
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
