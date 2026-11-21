import { fetchUserSettings } from '@mybiblelog/shared';

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
    const { startPage } = await fetchUserSettings(nuxtApp.$http);
    if (startPage && startPage !== 'start') {
      // Own-key check, so inherited names like `constructor` never match.
      if (Object.hasOwn(REDIRECT_MAP, startPage)) {
        return navigateTo(localePath(REDIRECT_MAP[startPage as keyof typeof REDIRECT_MAP]));
      }
    }
  }
  catch {
    // no redirect on error — show the welcome screen
  }
});
