export interface NavItemVisibility {
  authOnly?: boolean;
  guestOnly?: boolean;
}

export function isNavItemVisible(item: NavItemVisibility, loggedIn: boolean): boolean {
  const authOnly = item.authOnly ?? false;
  const guestOnly = item.guestOnly ?? false;
  return (!authOnly || loggedIn) && (!guestOnly || !loggedIn);
}

export function filterVisibleNavItems<T extends NavItemVisibility>(items: readonly T[], loggedIn: boolean): T[] {
  return items.filter(item => isNavItemVisible(item, loggedIn));
}

export function isAdminNavVisible(loggedIn: boolean, isAdmin: boolean | undefined): boolean {
  return Boolean(loggedIn && isAdmin);
}
