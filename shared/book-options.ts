import Bible from './bible';

/**
 * A selectable Bible book, decoupled from any UI framework.
 * `value` is the canonical `bibleOrder` index used everywhere else.
 */
export type BookOption = {
  label: string;
  value: number;
};

export type Testament = 'old' | 'new';
export type BookSortOrder = 'numerical' | 'alphabetical';

export type FilterAndSortBookOptions = {
  testament?: Testament;
  sortOrder?: BookSortOrder;
  locale?: string;
};

/**
 * Builds the full, localized list of book options in canonical bible order.
 * Pure: depends only on the shared `Bible` data, so it can back a React hook,
 * a Pinia store, or a plain component identically.
 */
export const getBookOptions = (locale = 'en'): BookOption[] =>
  Bible.getBooks().map(book => ({
    label: Bible.getBookName(book.bibleOrder, locale),
    value: book.bibleOrder,
  }));

const stripLeadingNumbers = (str: string): string => str.replace(/^\d+\s*/, '').trim();

const newTestamentByBook = (): Map<number, boolean> => {
  const map = new Map<number, boolean>();
  for (const book of Bible.getBooks()) {
    map.set(book.bibleOrder, book.newTestament);
  }
  return map;
};

/**
 * Filters book options to a single testament and sorts them either in
 * canonical (numerical) order or alphabetically by name (ignoring any
 * leading ordinal like "1" in "1 Samuel"). Returns a new array; the input
 * is not mutated.
 */
export const filterAndSortBookOptions = (
  options: ReadonlyArray<BookOption>,
  { testament = 'old', sortOrder = 'numerical', locale = 'en' }: FilterAndSortBookOptions = {},
): BookOption[] => {
  const isNewTestament = newTestamentByBook();

  let filtered = options.filter((option) => {
    const newTestament = isNewTestament.get(option.value);
    if (newTestament === undefined) {
      return false;
    }
    return testament === 'old' ? !newTestament : newTestament;
  });

  if (sortOrder === 'alphabetical') {
    filtered = [...filtered].sort((a, b) =>
      stripLeadingNumbers(a.label).localeCompare(stripLeadingNumbers(b.label), locale),
    );
  }
  else {
    filtered = [...filtered].sort((a, b) => a.value - b.value);
  }

  return filtered;
};
