import { defineStore } from 'pinia';

const DEFAULT_LOCALE = 'en';

export type AuthUser = {
  email?: string;
  isAdmin?: boolean;
  hasLocalAccount?: boolean;
};

export type AuthState = {
  loggedIn: boolean;
  user: AuthUser | null;
};

export type LogoutReason = 'session_expired';

type Http = {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: unknown) => Promise<T>;
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
      const { $http } = useNuxtApp() as { $http: Http };
      try {
        const { data } = await $http.post<{ data: { user: AuthUser } }>('/api/auth/login', { email, password });
        this.setUser(data?.user ?? null);
      }
      catch (error) {
        this.setUser(null);
        throw error;
      }
    },

    async refreshUser(): Promise<void> {
      const { $http } = useNuxtApp() as { $http: Http };
      const { data } = await $http.get<{ data: { user: AuthUser | null } }>('/api/auth/user');
      this.setUser(data?.user ?? null);
    },

    async logout(reason?: LogoutReason): Promise<void> {
      const { $http } = useNuxtApp() as { $http: Http };
      try {
        await $http.post('/api/auth/logout');
      }
      catch {
        // Expected to fail after account deletion
      }

      this.setUser(null);

      if (import.meta.client) {
        sessionStorage.clear();
        const nuxtApp = useNuxtApp();
        const i18n = nuxtApp.$i18n as { locale: { value: string } } | undefined;
        const locale = i18n?.locale?.value ?? 'en';
        const loginPath = locale === DEFAULT_LOCALE ? '/login' : `/${locale}/login`;
        window.location.href = reason ? `${loginPath}?reason=${reason}` : loginPath;
      }
    },
  },
});
