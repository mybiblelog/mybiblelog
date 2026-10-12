import { filterAndSortBookOptions, getBookOptions } from "@mybiblelog/shared";
import type { BookListPrefs } from "@/src/stores/bookListPrefs";

/**
 * Filters per-book items to the chosen testament and puts them in the chosen
 * display order (canonical, or alphabetical by localized name). Pure view
 * concern: the input stays the full canonical list. Returns a new array.
 */
export function filterAndSortBooks<T extends { bookIndex: number }>(
  books: readonly T[],
  { testament, sortOrder }: BookListPrefs,
  locale: string
): T[] {
  const byIndex = new Map(books.map((book) => [book.bookIndex, book]));
  return filterAndSortBookOptions(getBookOptions(locale), { testament, sortOrder, locale })
    .map((option) => byIndex.get(option.value))
    .filter((book): book is T => book !== undefined);
}
