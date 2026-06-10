import { defineStore } from 'pinia';
import { defaultLocale } from '@mybiblelog/shared';

export type AuthUser = {
  email?: string;
  isAdmin?: boolean;
  hasLocalAccount?: boolean;
};

export type AuthState = {
  loggedIn: boolean;
  user: AuthUser | null;
};

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
      try {
        const { data } = await this.$http.post<{ user: AuthUser }>('/api/auth/login', { email, password });
        this.setUser(data?.user ?? null);
      }
      catch (error) {
        this.setUser(null);
        throw error;
      }
    },

    async refreshUser(): Promise<void> {
      const { data } = await this.$http.get<{ user: AuthUser | null }>('/api/auth/user');
      this.setUser(data?.user ?? null);
    },

    async logout(): Promise<void> {
      try {
        // Send API request to delete token from HttpOnly cookie
        await this.$http.post('/api/auth/logout');
      }
      catch {
        // This is expected to fail after account deletion
      }

      this.setUser(null);

      if (process.client) {
        // Clear session storage and fully reload the page
        // to ensure the user is logged out and all store data is cleared.
        sessionStorage.clear();
        const locale = this.$i18n.locale;
        const loginPath = locale === defaultLocale ? '/login' : `/${locale}/login`;
        window.location.href = loginPath;
      }
    },
  },
});
