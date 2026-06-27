const REDIRECT_MAP: Record<string, string> = {
  today: '/today',
  books: '/books',
  checklist: '/checklist',
  calendar: '/calendar',
  notes: '/notes',
};

export default defineNuxtRouteMiddleware(async () => {
  const nuxtApp = useNuxtApp() as { $http: { get: <T>(path: string) => Promise<T> } };
  const localePath = useLocalePath();
  try {
    const { data } = await nuxtApp.$http.get<{ data: { startPage?: string } }>('/api/settings');
    const startPage = data?.startPage;
    if (startPage && startPage !== 'start') {
      const redirectPath = REDIRECT_MAP[startPage];
      if (redirectPath) {
        return navigateTo(localePath(redirectPath));
      }
    }
  }
  catch {
    // no redirect on error — show the welcome screen
  }
});
