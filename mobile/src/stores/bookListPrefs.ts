import { create } from "zustand";
import type { BookSortOrder, TestamentFilter } from "@mybiblelog/shared";
import { appStorage } from "@/src/storage/keys";

/**
 * Book-list view preferences (Zustand), shared by the Bible Books and Chapter
 * Checklist screens: which testament is shown and the order books are listed
 * in. Device-local, like web's `mbl_book_list` cookie. Stored as one object so
 * new options (e.g. deuterocanonical books) can be added without a migration.
 */

export type BookListPrefs = {
  testament: TestamentFilter;
  sortOrder: BookSortOrder;
};

export const DEFAULT_BOOK_LIST_PREFS: BookListPrefs = { testament: "all", sortOrder: "numerical" };

const TESTAMENT_FILTERS: readonly TestamentFilter[] = ["all", "old", "new"];
const BOOK_SORT_ORDERS: readonly BookSortOrder[] = ["numerical", "alphabetical"];

function pick<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback;
}

export function normalizeBookListPrefs(raw: unknown): BookListPrefs {
  const prefs = (raw && typeof raw === "object" ? raw : {}) as Partial<
    Record<keyof BookListPrefs, unknown>
  >;
  return {
    testament: pick(TESTAMENT_FILTERS, prefs.testament, DEFAULT_BOOK_LIST_PREFS.testament),
    sortOrder: pick(BOOK_SORT_ORDERS, prefs.sortOrder, DEFAULT_BOOK_LIST_PREFS.sortOrder),
  };
}

type BookListPrefsStore = {
  prefs: BookListPrefs;
  /** Set once the user changes a preference, so a late hydrate can't overwrite it. */
  touched: boolean;
  update: (patch: Partial<BookListPrefs>) => void;
};

export const useBookListPrefsStore = create<BookListPrefsStore>((set, get) => ({
  prefs: DEFAULT_BOOK_LIST_PREFS,
  touched: false,

  update(patch) {
    const prefs = { ...get().prefs, ...patch };
    set({ prefs, touched: true });
    void appStorage.set("bookListPrefs", prefs);
  },
}));

let initialized = false;

export function initBookListPrefs(): void {
  if (initialized) return;
  initialized = true;

  void (async () => {
    const stored = await appStorage.get("bookListPrefs");
    if (stored && !useBookListPrefsStore.getState().touched) {
      useBookListPrefsStore.setState({ prefs: normalizeBookListPrefs(stored) });
    }
  })();
}

export function useBookListPrefs(): BookListPrefs {
  return useBookListPrefsStore((s) => s.prefs);
}

export const bookListPrefsActions = {
  setTestament: (testament: TestamentFilter) =>
    useBookListPrefsStore.getState().update({ testament }),
  setSortOrder: (sortOrder: BookSortOrder) =>
    useBookListPrefsStore.getState().update({ sortOrder }),
};
