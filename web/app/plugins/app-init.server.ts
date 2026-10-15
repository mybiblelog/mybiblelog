import { useAuthStore } from '~/stores/auth';
import { useAppInitStore } from '~/stores/app-init';
import { useThemeStore } from '~/stores/theme';

export default defineNuxtPlugin(async () => {
  const { cookie } = useRequestHeaders(['cookie']);
  const themeStore = useThemeStore();
  themeStore.initFromCookie(cookie ?? '');

  const authStore = useAuthStore();
  if (cookie?.includes('auth_token=')) {
    try {
      await authStore.refreshUser();
    }
    catch {
      authStore.setUser(null);
    }
  }

  if (authStore.loggedIn) {
    const appInitStore = useAppInitStore();
    try {
      await appInitStore.loadUserData();
    }
    catch {
      // Degrade to an unauthenticated-data render rather than failing SSR
      // for every logged-in user hitting a transient API/network error.
    }
  }
});
