import { useAuthStore } from '~/stores/auth';
import { useThemeStore } from '~/stores/theme';
import { useUserSettingsStore } from '~/stores/user-settings';

export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore();
  themeStore.initFromCookie(typeof document !== 'undefined' ? document.cookie : '');
  themeStore.initClient();

  if (useAuthStore().loggedIn) {
    useUserSettingsStore().loadClientSettings();
  }
});
