import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '~/stores/auth';

beforeEach(() => setActivePinia(createPinia()));

function stubHttp(http: Record<string, unknown>) {
  vi.stubGlobal('useNuxtApp', () => ({ $http: http, $i18n: { locale: { value: 'en' } } }));
}

describe('auth store', () => {
  it('setUser updates user and loggedIn', () => {
    const store = useAuthStore();
    store.setUser({ email: 'a@b.com' });
    expect(store.loggedIn).toBe(true);
    expect(store.user).toEqual({ email: 'a@b.com' });
    store.setUser(null);
    expect(store.loggedIn).toBe(false);
    expect(store.user).toBeNull();
  });

  it('isAdmin is true only when logged in with an admin user', () => {
    const store = useAuthStore();
    expect(store.isAdmin).toBe(false);
    store.setUser({ email: 'a@b.com', isAdmin: true });
    expect(store.isAdmin).toBe(true);
    store.setUser({ email: 'a@b.com', isAdmin: false });
    expect(store.isAdmin).toBe(false);
  });

  it('login sets the user from the response', async () => {
    const post = vi.fn().mockResolvedValue({ data: { user: { email: 'a@b.com', isAdmin: true } } });
    stubHttp({ post });
    const store = useAuthStore();
    await store.login({ email: 'a@b.com', password: 'pw' });
    expect(post).toHaveBeenCalledWith('/api/auth/login', { email: 'a@b.com', password: 'pw' });
    expect(store.loggedIn).toBe(true);
    expect(store.user?.isAdmin).toBe(true);
  });

  it('login clears the user and rethrows on failure', async () => {
    const error = new Error('bad creds');
    stubHttp({ post: vi.fn().mockRejectedValue(error) });
    const store = useAuthStore();
    store.setUser({ email: 'a@b.com' });
    await expect(store.login({ email: 'a@b.com', password: 'wrong' })).rejects.toBe(error);
    expect(store.loggedIn).toBe(false);
    expect(store.user).toBeNull();
  });

  it('refreshUser pulls the current user', async () => {
    stubHttp({ get: vi.fn().mockResolvedValue({ data: { user: { email: 'a@b.com' } } }) });
    const store = useAuthStore();
    await store.refreshUser();
    expect(store.user).toEqual({ email: 'a@b.com' });
  });

  it('refreshUser clears the user when none is returned', async () => {
    stubHttp({ get: vi.fn().mockResolvedValue({ data: { user: null } }) });
    const store = useAuthStore();
    store.setUser({ email: 'a@b.com' });
    await store.refreshUser();
    expect(store.user).toBeNull();
  });

  it('logout clears the user even if the request fails', async () => {
    stubHttp({ post: vi.fn().mockRejectedValue(new Error('already gone')) });
    const store = useAuthStore();
    store.setUser({ email: 'a@b.com' });
    await store.logout();
    expect(store.loggedIn).toBe(false);
    expect(store.user).toBeNull();
  });
});
