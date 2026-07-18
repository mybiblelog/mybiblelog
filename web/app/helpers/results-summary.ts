export type ResultsSummary =
  | { kind: 'none'; total: 0 }
  | { kind: 'all'; total: number }
  | { kind: 'range'; first: number; last: number; total: number };

/**
 * Computes the "showing X–Y of Z" summary state for a paginated list, shared by
 * the log, notes, and admin-feedback pages (each of which reimplemented the
 * same branch/arithmetic). Returns a structured result so each caller can map it
 * to its own i18n strings and pluralization rather than baking copy in here.
 *
 * - `none`  — nothing matched.
 * - `all`   — the whole result set fits on one page.
 * - `range` — a windowed page; `first`/`last` are 1-based and clamped to `total`.
 */
export function buildResultsSummary(input: {
  total: number;
  offset: number;
  limit: number;
  pageLength: number;
}): ResultsSummary {
  const total = Math.max(0, Number(input.total) || 0);
  if (!total) { return { kind: 'none', total: 0 }; }

  const limit = Math.max(1, Number(input.limit) || 1);
  if (total <= limit) { return { kind: 'all', total }; }

  const offset = Math.max(0, Number(input.offset) || 0);
  const pageLength = Math.max(0, Number(input.pageLength) || 0);
  const first = offset + 1;
  const last = Math.min(offset + pageLength, total);
  return { kind: 'range', first, last, total };
}
