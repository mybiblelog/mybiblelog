import { describe, it, expect } from 'vitest';
import { filterVisibleNavItems, isAdminNavVisible, isNavItemVisible } from '~/helpers/site-nav-visibility';

describe('isNavItemVisible', () => {
  it('shows items with no restriction to everyone', () => {
    expect(isNavItemVisible({}, true)).toBe(true);
    expect(isNavItemVisible({}, false)).toBe(true);
  });

  it('hides authOnly items from logged-out visitors', () => {
    expect(isNavItemVisible({ authOnly: true }, false)).toBe(false);
    expect(isNavItemVisible({ authOnly: true }, true)).toBe(true);
  });

  it('hides guestOnly items from logged-in users', () => {
    expect(isNavItemVisible({ guestOnly: true }, true)).toBe(false);
    expect(isNavItemVisible({ guestOnly: true }, false)).toBe(true);
  });
});

describe('filterVisibleNavItems', () => {
  const items = [
    { to: '/today', authOnly: true },
    { to: '/about', guestOnly: true },
    { to: '/help' },
  ];

  it('filters to only the items visible when logged in', () => {
    expect(filterVisibleNavItems(items, true).map(i => i.to)).toEqual(['/today', '/help']);
  });

  it('filters to only the items visible when logged out', () => {
    expect(filterVisibleNavItems(items, false).map(i => i.to)).toEqual(['/about', '/help']);
  });
});

describe('isAdminNavVisible', () => {
  it('requires both logged in and admin', () => {
    expect(isAdminNavVisible(true, true)).toBe(true);
    expect(isAdminNavVisible(true, false)).toBe(false);
    expect(isAdminNavVisible(false, true)).toBe(false);
    expect(isAdminNavVisible(true, undefined)).toBe(false);
  });
});
