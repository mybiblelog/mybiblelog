import Bible from './index';

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
 * Builds the localized list of book options for a reader's canon, in display
 * order. Deuterocanonical books are opt-in and, when included, are interleaved
 * between the Protestant books following the NRSVUE full-canon order.
 * Pure: depends only on the shared `Bible` data, so it can back a React hook,
 * a Pinia store, or a plain component identically.
 */
export const getBookOptions = (locale = 'en', includeDeuterocanonical = false): BookOption[] =>
  Bible.getBooksForCanon(includeDeuterocanonical).map(book => ({
    label: Bible.getBookName(book.bibleOrder, locale),
    value: book.bibleOrder,
  }));

const stripLeadingNumbers = (str: string): string => str.replace(/^\d+\s*/, '').trim();

const newTestamentByBook = (): Map<number, boolean> => {
  const map = new Map<number, boolean>();
  for (const book of Bible.getAllBooks()) {
    map.set(book.bibleOrder, book.newTestament);
  }
  return map;
};

/** Maps each book's `bibleOrder` to its full-canon display position (`dcBookOrder`). */
const dcBookOrderByBook = (): Map<number, number> => {
  const map = new Map<number, number>();
  for (const book of Bible.getAllBooks()) {
    map.set(book.bibleOrder, book.dcBookOrder);
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
    // Numerical order follows the full-canon display order so deuterocanonical
    // books slot in between their Protestant neighbours rather than after them.
    // For the Protestant-only canon this is identical to sorting by bibleOrder.
    const dcOrder = dcBookOrderByBook();
    filtered = [...filtered].sort(
      (a, b) => (dcOrder.get(a.value) ?? a.value) - (dcOrder.get(b.value) ?? b.value),
    );
  }

  return filtered;
};
