import { buildResultsSummary } from '~/helpers/results-summary';

/**
 * Manages fixed-page-size pagination for a server-backed list: current page,
 * total size, derived total-pages/offset, a results summary (via
 * `buildResultsSummary`), and page navigation that reloads and optionally
 * scrolls to top. Used by the admin feedback page and available to other
 * offset/limit paginated views.
 *
 * `load` is the caller's fetch for the current page — it reads `offset`/`page`
 * and should call `applyServerMeta` / set `size` + `pageLength` with the result.
 */
export function usePagedResource(opts: {
  limit: number;
  load: () => void | Promise<void>;
  scrollToTopOnPageChange?: boolean;
}) {
  const page = ref(1);
  const size = ref(0);
  const pageLength = ref(0);

  const totalPages = computed(() => Math.max(1, Math.ceil(size.value / opts.limit) || 1));
  const offset = computed(() => (page.value - 1) * opts.limit);

  const summary = computed(() => buildResultsSummary({
    total: size.value,
    offset: offset.value,
    limit: opts.limit,
    pageLength: pageLength.value,
  }));

  /** Sync page/size from a server pagination meta block after a load. */
  function applyServerMeta(meta: { offset?: number; size?: number }, currentPageLength: number) {
    size.value = Math.max(0, Number(meta.size) || 0);
    pageLength.value = Math.max(0, Number(currentPageLength) || 0);
    page.value = Math.floor((Math.max(0, Number(meta.offset) || 0)) / opts.limit) + 1;
  }

  function goToPage(next: number) {
    const clamped = Math.min(Math.max(Number(next) || 1, 1), totalPages.value);
    if (clamped === page.value) { return; }
    page.value = clamped;
    const result = opts.load();
    if (opts.scrollToTopOnPageChange && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return result;
  }

  /** Reset to the first page (e.g. after changing filters). */
  function reset() {
    page.value = 1;
  }

  return { page, size, pageLength, totalPages, offset, summary, applyServerMeta, goToPage, reset };
}
