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
});

