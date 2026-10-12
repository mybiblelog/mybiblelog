import type { BookSortOrder, TestamentFilter } from '@mybiblelog/shared';

type BookListPrefs = {
  testament: TestamentFilter;
  sortOrder: BookSortOrder;
};

const DEFAULT_PREFS: BookListPrefs = { testament: 'all', sortOrder: 'numerical' };

const TESTAMENT_FILTERS: readonly TestamentFilter[] = ['all', 'old', 'new'];
const BOOK_SORT_ORDERS: readonly BookSortOrder[] = ['numerical', 'alphabetical'];

const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T =>
  (allowed as readonly unknown[]).includes(value) ? value as T : fallback;

const normalize = (raw: unknown): BookListPrefs => {
  const prefs = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof BookListPrefs, unknown>>;
  return {
    testament: pick(TESTAMENT_FILTERS, prefs.testament, DEFAULT_PREFS.testament),
    sortOrder: pick(BOOK_SORT_ORDERS, prefs.sortOrder, DEFAULT_PREFS.sortOrder),
  };
};

/**
 * Per-device filter and order for the Bible Books list.
 *
 * Kept in a cookie rather than the Web Storage registry (`helpers/app-storage.ts`)
 * because SSR has to render the saved order; a client-only store would make
 * the list reshuffle after hydration. Stored as one object so new options
 * (e.g. deuterocanonical books) can be added without a migration.
 */
export function useBookListPrefs() {
  const cookie = useCookie<BookListPrefs>('mbl_book_list', {
    default: () => ({ ...DEFAULT_PREFS }),
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  const prefs = computed(() => normalize(cookie.value));

  const update = (patch: Partial<BookListPrefs>) => {
    cookie.value = { ...prefs.value, ...patch };
  };

  const testament = computed<TestamentFilter>({
    get: () => prefs.value.testament,
    set: (value) => { update({ testament: value }); },
  });

  const sortOrder = computed<BookSortOrder>({
    get: () => prefs.value.sortOrder,
    set: (value) => { update({ sortOrder: value }); },
  });

  return { testament, sortOrder };
}
