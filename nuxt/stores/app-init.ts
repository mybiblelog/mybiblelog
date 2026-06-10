import { defineStore } from 'pinia';

import { useAuthStore } from '~/stores/auth';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useThemeStore } from '~/stores/theme';
import { useUserSettingsStore } from '~/stores/user-settings';

const AUTH_COOKIE_NAME = 'auth_token';

const parseCookieHeader = (cookieHeader: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const part of String(cookieHeader || '').split(';')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) {
      continue;
    }
    const name = trimmed.slice(0, eqIdx).trim();
    const rawValue = trimmed.slice(eqIdx + 1);
    if (!name) {
      continue;
    }
    try {
      out[name] = decodeURIComponent(rawValue);
    }
    catch {
      /* eslint-disable no-console */
      console.warn('[auth] failed to decode cookie during SSR', {
        cookieName: name,
        rawLength: rawValue.length,
      });
      /* eslint-enable no-console */
      out[name] = rawValue;
    }
  }
  return out;
};

export const useAppInitStore = defineStore('app-init', {
  actions: {
    async serverInit({ req, app }: { req?: { headers?: { cookie?: string } }; app: unknown }): Promise<void> {
      const cookieHeader = req?.headers?.cookie;
      useThemeStore().initFromCookie(cookieHeader);

      if (cookieHeader && cookieHeader.includes(`${AUTH_COOKIE_NAME}=`)) {
        const cookies = parseCookieHeader(cookieHeader);
        const token = cookies[AUTH_COOKIE_NAME];
        if (token) {
          // `app` is not serialized into the HTML response,
          // so it's safe to store the token here for SSR access
          (app as { ssrToken?: string }).ssrToken = token;
          try {
            await useAuthStore().refreshUser();
          }
          catch {
            // Token is invalid or user no longer exists — treat as unauthenticated
            // so the auth middleware can redirect to /login instead of crashing SSR.
            useAuthStore().setUser(null);
          }
        }
      }

      if (useAuthStore().loggedIn) {
        await this.loadUserData();
      }
    },

    clientInit(): void {
      const themeStore = useThemeStore();
      themeStore.initFromCookie(typeof document !== 'undefined' ? document.cookie : '');
      themeStore.initClient();

      if (useAuthStore().loggedIn) {
        // On client side, re-trigger user settings load
        // since some settings are stored in LocalStorage
        useUserSettingsStore().loadClientSettings();
      }
    },

    async loadUserData(): Promise<void> {
      await useLogEntriesStore().loadLogEntries();
      await useUserSettingsStore().loadSettings();
    },
  },
});
