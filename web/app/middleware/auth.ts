import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();
  const localePath = useLocalePath();
  const authRule = to.meta?.auth as string | undefined;

  const isLoggedIn = authStore.loggedIn;
  const isAdmin = Boolean(isLoggedIn && authStore.user?.isAdmin);

  if (authRule === 'guest') {
    if (isLoggedIn) {
      return navigateTo(localePath('/start'));
    }
  }
  else if (authRule === 'admin' && !isAdmin) {
    throw createError({ statusCode: 403 });
  }
  else if (!authRule && !isLoggedIn) {
    return navigateTo(localePath('/login'));
  }
});
