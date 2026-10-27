const REDIRECT_MAP = {
  today: 'today',
  books: 'books',
  checklist: 'checklist',
  calendar: 'calendar',
  notes: 'notes',
} as const;

export default defineNuxtRouteMiddleware(async () => {
  const nuxtApp = useNuxtApp();
  const localePath = useLocalePath();
  try {
    const { data } = await nuxtApp.$http.get<{ startPage?: string }>('/api/settings');
    const startPage = data?.startPage;
    if (startPage && startPage !== 'start') {
      const redirectRoute = REDIRECT_MAP[startPage as keyof typeof REDIRECT_MAP];
      if (redirectRoute) {
        return navigateTo(localePath(redirectRoute));
      }
    }
  }
  catch {
    // no redirect on error — show the welcome screen
  }
});
