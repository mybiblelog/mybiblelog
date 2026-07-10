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
    await appInitStore.loadUserData();
  }
});
