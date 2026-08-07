import { Bible } from '@mybiblelog/shared';

/*
 * `/books/:book` takes a numeric book index — every in-app link builds it as
 * `/books/${bookIndex}` (BibleReport.vue, books/index.vue). A hand-typed or
 * stale URL can carry a non-numeric or out-of-range value, which reaches the
 * Bible lookups as NaN and blows the stack. Send those to the book list, the
 * same place the report's own back button goes.
 */
export default defineNuxtRouteMiddleware((to) => {
  const localePath = useLocalePath();
  const raw = String(to.params.book ?? '');
  const bookIndex = Number(raw);
  const isValidBookIndex = /^\d+$/.test(raw) &&
    bookIndex >= 1 &&
    bookIndex <= Bible.getBookCount();
  if (!isValidBookIndex) {
    return navigateTo(localePath('/books'));
  }
});
