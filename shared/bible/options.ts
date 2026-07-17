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

/** An autocomplete suggestion for a partially typed book name. */
export type BookSuggestion = {
  book: number;
  label: string;
};

export type SuggestBooksOptions = {
  locale?: string;
  limit?: number;
};

const normalizeForMatch = (str: string, locale: string): string => str
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .toLocaleLowerCase(locale)
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Prefix-matches a partially typed query against localized book names and
 * abbreviations, for driving an autocomplete dropdown. Matching is case- and
 * diacritic-insensitive with whitespace collapsed, so "genesis" matches
 * "Génesis" (es) and "1joh" matches "1 John". Name matches rank before
 * abbreviation-only matches; ties keep bible order.
 */
export const suggestBooks = (
  query: string,
  { locale = 'en', limit = 8 }: SuggestBooksOptions = {},
): BookSuggestion[] => {
  const normalizedQuery = normalizeForMatch(query, locale).replace(/ /g, '');
  if (!normalizedQuery) {
    return [];
  }

  const nameMatches: BookSuggestion[] = [];
  const abbreviationMatches: BookSuggestion[] = [];
  for (const book of Bible.getBooks()) {
    const localized = book.locales[locale] || book.locales.en!;
    const normalize = (value: string) => normalizeForMatch(value, locale).replace(/ /g, '');
    if (normalize(localized.name).startsWith(normalizedQuery)) {
      nameMatches.push({ book: book.bibleOrder, label: localized.name });
    }
    else if (localized.abbreviations.some(abbreviation => normalize(abbreviation).startsWith(normalizedQuery))) {
      abbreviationMatches.push({ book: book.bibleOrder, label: localized.name });
    }
  }

  return [...nameMatches, ...abbreviationMatches].slice(0, limit);
};

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
