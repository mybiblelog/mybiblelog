import { describe, test, expect } from 'vitest';
import xml2js from 'xml2js';
import { requestApi } from './helpers';

describe('Sitemap routes', () => {
  test('GET /api/sitemap.xml', async () => {
    // Act
    const res = await requestApi
      .get('/api/sitemap.xml');

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/xml; charset=utf-8');
  });

  test('GET /api/sitemap.xml (valid XML)', async () => {
    // Act
    const res = await requestApi
      .get('/api/sitemap.xml');

    // Assert
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(res.text);
    expect(result).toBeDefined();
    expect(result.urlset).toBeDefined();
    expect(result.urlset.$.xmlns).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
  });

  test('GET /api/sitemap.xml (contains internationalized routes)', async () => {
    // Act
    const res = await requestApi
      .get('/api/sitemap.xml');

    // Assert
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(res.text);
    const urls = result.urlset.url.map((url: any) => url.loc[0]);

    // Check for internationalized routes
    expect(urls.some((url: string) => url.includes('/about/'))).toBe(true);
    expect(urls.some((url: string) => url.includes('/de/'))).toBe(true);
    expect(urls.some((url: string) => url.includes('/es/'))).toBe(true);
    expect(urls.some((url: string) => url.includes('/fr/'))).toBe(true);
    expect(urls.some((url: string) => url.includes('/ko/'))).toBe(true);
    expect(urls.some((url: string) => url.includes('/pt/'))).toBe(true);
    expect(urls.some((url: string) => url.includes('/uk/'))).toBe(true);
  });

  test('GET /api/sitemap.xml (includes Vue-rendered resource pages)', async () => {
    // Act
    const res = await requestApi
      .get('/api/sitemap.xml');

    // Assert
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(res.text);
    const urls = result.urlset.url.map((url: any) => url.loc[0]);
    expect(urls.some((url: string) => url.endsWith('/resources/printable-bible-reading-tracker'))).toBe(true);
    expect(urls.some((url: string) => url.endsWith('/de/resources/printable-bible-reading-tracker'))).toBe(true);
  });

  test('GET /api/sitemap.xml (lastmod comes from frontmatter, not the current date)', async () => {
    // Act
    const res = await requestApi
      .get('/api/sitemap.xml');

    // Assert
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(res.text);
    const entries: { loc: string; lastmod?: string }[] = result.urlset.url.map((url: any) => ({
      loc: url.loc[0],
      lastmod: url.lastmod?.[0],
    }));

    const overview = entries.find((entry) => entry.loc.endsWith('/about/overview') && !/\/[a-z]{2}\/about\//.test(entry.loc));
    expect(overview?.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // pages without a dateModified field omit <lastmod> rather than claiming "today"
    expect(entries.some((entry) => entry.lastmod === undefined)).toBe(true);
  });
});
