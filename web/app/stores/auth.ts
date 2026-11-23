import { defineStore } from 'pinia';
import { fetchAuthUser, login, logout, type AuthUser } from '@mybiblelog/shared';
import { sessionStore } from '~/helpers/app-storage';
import { useAppInitStore } from '~/stores/app-init';

// Must match the `cacheName` in nuxt.config.ts's workbox runtimeCaching.
const PWA_CACHE_NAME = 'my-bible-log-cache';

const DEFAULT_LOCALE = 'en';

// Exported (rather than inlined in logout()) so it can be unit tested directly:
// it's only reached through logout()'s `import.meta.client` branch, which is
// compiled out under the test runner's server-only esbuild define.
export async function purgePwaRuntimeCache(): Promise<void> {
  if (typeof caches === 'undefined') { return; }
  await caches.delete(PWA_CACHE_NAME);
}

export type { AuthUser };

export type AuthState = {
  loggedIn: boolean;
  user: AuthUser | null;
};

export type LogoutReason = 'session_expired';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    loggedIn: false,
    user: null,
  }),
  getters: {
    isAdmin: state => Boolean(state.loggedIn && state.user && state.user.isAdmin),
  },
  actions: {
    setUser(user: AuthUser | null): void {
      this.user = user;
      this.loggedIn = Boolean(user);
    },

    async login({ email, password }: { email: string; password: string }): Promise<void> {
      const http = useHttp();
      try {
        const { user } = await login(http, { email, password });
        this.setUser(user);
        // A fresh session may follow a previous user's; drop any stale cached
        // data so the destination page's loadUserData() pulls this user's data.
        useAppInitStore().resetUserData();
      }
      catch (error) {
        this.setUser(null);
        throw error;
      }
    },

    async refreshUser(): Promise<void> {
      const http = useHttp();
      this.setUser(await fetchAuthUser(http));
    },

    async logout(reason?: LogoutReason): Promise<void> {
      const http = useHttp();
      try {
        await logout(http);
      }
      catch {
        // Expected to fail after account deletion
      }

      this.setUser(null);
      useAppInitStore().resetUserData();

      if (import.meta.client) {
        sessionStore.clearAll();
        // The PWA's workbox cache is keyed by URL only, not by user, so a
        // previous user's cached API responses would otherwise remain
        // readable (and offline-servable) on a shared device after logout.
        await purgePwaRuntimeCache();
        const nuxtApp = useNuxtApp();
        const i18n = nuxtApp.$i18n as { locale: { value: string } } | undefined;
        const locale = i18n?.locale?.value ?? 'en';
        const loginPath = locale === DEFAULT_LOCALE ? '/login' : `/${locale}/login`;
        window.location.href = reason ? `${loginPath}?reason=${reason}` : loginPath;
      }
    },
  },
});
