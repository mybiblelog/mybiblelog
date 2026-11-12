import { toValue, type MaybeRefOrGetter } from 'vue';
import { Bible, getUnreadBooksOutsideCanon, type ReadingGoalProgress } from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';

/**
 * Localized list of the goal's unread books that the reader's canon setting
 * hides from the log entry form (empty string when there are none).
 */
export const useGoalBooksOutsideCanon = (progress: MaybeRefOrGetter<ReadingGoalProgress | null>) => {
  const { locale } = useI18n();
  const userSettingsStore = useUserSettingsStore();

  return computed(() => {
    const value = toValue(progress);
    if (!value) { return ''; }
    const books = getUnreadBooksOutsideCanon(value, userSettingsStore.settings.includeDeuterocanonical);
    if (!books.length) { return ''; }
    const names = books.map(book => Bible.getBookName(book, locale.value));
    return new Intl.ListFormat(locale.value, { style: 'long', type: 'conjunction' }).format(names);
  });
};
