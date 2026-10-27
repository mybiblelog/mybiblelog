import { describe, it, expect } from 'vitest';
import { documentedRoutes } from '../http/routes';

/**
 * Pins exactly which routes a personal access token can reach. Routes without
 * `scopes` reject access tokens, so this list only grows when someone opts a
 * route in on purpose; a change here should be a deliberate security decision.
 */
describe('access token route scopes', () => {
  it('lets access tokens reach only the reading log, notes, tags, Scripture and reading settings', () => {
    const scoped = documentedRoutes
      .filter((route) => route.scopes?.length)
      .map((route) => `${route.method} ${route.path} ${route.scopes!.join(',')}`)
      .sort();

    expect(scoped).toEqual([
      'DELETE /log-entries/:id logs:write',
      'DELETE /passage-note-tags/:id notes:write',
      'DELETE /passage-notes/:id notes:write',
      'GET /log-entries logs:read',
      'GET /log-entries/:id logs:read',
      'GET /passage-note-tags notes:read',
      'GET /passage-note-tags/:id notes:read',
      'GET /passage-notes notes:read',
      'GET /passage-notes/:id notes:read',
      'GET /passage-notes/count/books notes:read',
      'GET /scripture/passage scripture:read',
      'GET /settings logs:read',
      'PATCH /log-entries/:id logs:write',
      'PATCH /passage-note-tags/:id notes:write',
      'PATCH /passage-notes/:id notes:write',
      'POST /log-entries logs:write',
      'POST /passage-note-tags notes:write',
      'POST /passage-notes notes:write',
    ]);
  });

  it('never opens account, auth, admin, reminder or token-management routes to access tokens', () => {
    const forbidden = /^\/(auth|admin|reminders|access-tokens|settings\/account)/;
    const leaked = documentedRoutes.filter((route) => route.scopes?.length && forbidden.test(route.path));
    expect(leaked).toEqual([]);
  });
});
