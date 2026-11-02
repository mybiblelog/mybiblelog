import { describe, it, expect } from 'vitest';
import { buildRouteTable, stubLocalePath } from './locale-path-stub';

describe('buildRouteTable', () => {
  it('names routes the way Nuxt does', () => {
    const table = buildRouteTable([
      '/app/pages/index.vue',
      '/app/pages/settings.vue',
      '/app/pages/settings/email.vue',
      '/app/pages/books/[book].vue',
      '/app/pages/docs/[...slug].vue',
      '/app/pages/blog/[[page]].vue',
    ]);
    expect(Object.fromEntries(table)).toEqual({
      index: '/',
      settings: '/settings',
      'settings-email': '/settings/email',
      'books-book': '/books/:book',
      'docs-slug': '/docs/:slug',
      'blog-page': '/blog/:page',
    });
  });
});

describe('stubLocalePath', () => {
  it('resolves route names from app/pages', () => {
    expect(stubLocalePath('index')).toBe('/');
    expect(stubLocalePath('settings-email')).toBe('/settings/email');
    expect(stubLocalePath({ name: 'books-book', params: { book: 3 } })).toBe('/books/3');
    expect(stubLocalePath({ name: 'about-slug', params: { slug: 'overview' } })).toBe('/about/overview');
  });

  it('passes plain paths through', () => {
    expect(stubLocalePath('/today')).toBe('/today');
    expect(stubLocalePath({ path: '/about/overview' })).toBe('/about/overview');
  });

  it('appends the query, repeating array values', () => {
    expect(stubLocalePath({ name: 'login', query: { error: 'oauth_failed' } })).toBe('/login?error=oauth_failed');
    expect(stubLocalePath({ name: 'notes', query: { tag: ['a', 'b'] } })).toBe('/notes?tag=a&tag=b');
  });

  it('throws for an unknown route name', () => {
    expect(() => stubLocalePath('no-such-page')).toThrow('unknown route name "no-such-page"');
  });

  it('throws for a missing param', () => {
    expect(() => stubLocalePath({ name: 'books-book' })).toThrow('missing param "book"');
  });
});
