import { clamp, parseIntOr, pickEnum, MAX_PAGE_SIZE } from './route-query-codec';

export type PassageNotesSortDirection = 'ascending' | 'descending';
export type PassageNotesSortOn = 'createdAt' | 'passage';
export type PassageNotesTagMatching = 'any' | 'all' | 'exact';
export type PassageNotesPassageMatching = 'inclusive' | 'exclusive';

const SORT_ON_VALUES = ['createdAt', 'passage'] as const;
const SORT_DIRECTION_VALUES = ['ascending', 'descending'] as const;

export type PassageNotesQuery = {
  limit: number;
  offset: number;
  sortOn: PassageNotesSortOn;
  sortDirection: PassageNotesSortDirection;
  filterTags: string[];
  filterTagMatching: PassageNotesTagMatching;
  searchText: string;
  filterPassageStartVerseId: number;
  filterPassageEndVerseId: number;
  filterPassageMatching: PassageNotesPassageMatching;
};

type RouteQueryLike = Record<string, unknown>;
type RouteQueryOut = Record<string, string | string[]>;

const DEFAULT_PASSAGE_NOTES_QUERY: PassageNotesQuery = {
  limit: 10,
  offset: 0,
  sortOn: 'createdAt',
  sortDirection: 'descending',
  filterTags: [],
  filterTagMatching: 'any',
  searchText: '',
  filterPassageStartVerseId: 0,
  filterPassageEndVerseId: 0,
  filterPassageMatching: 'inclusive',
};

/**
 * Sorting defaults to scripture order whenever a passage filter is in effect —
 * reading order is the point of a passage-scoped list. Both the decoder and the
 * encoder route through this so URL round-trips stay symmetric, which also means
 * deep links that only carry passage params land in Passage Order for free.
 */
export function defaultPassageNotesSort(hasPassageFilter: boolean): {
  sortOn: PassageNotesSortOn;
  sortDirection: PassageNotesSortDirection;
} {
  return hasPassageFilter
    ? { sortOn: 'passage', sortDirection: 'ascending' }
    : { sortOn: 'createdAt', sortDirection: 'descending' };
}

function asStringArray(value: unknown): string[] {
  if (value === null || value === undefined) { return []; }
  if (Array.isArray(value)) { return value.map(v => `${v}`); }
  if (`${value}`.trim() === '') { return []; }
  return [`${value}`];
}

export function decodePassageNotesRouteQuery(routeQuery: RouteQueryLike = {}): PassageNotesQuery {
  const filterTags = asStringArray(routeQuery.filterTags)
    .map(v => `${v}`.trim())
    .filter(Boolean);

  const filterPassageStartVerseId = parseIntOr(routeQuery.filterPassageStartVerseId, DEFAULT_PASSAGE_NOTES_QUERY.filterPassageStartVerseId);
  const filterPassageEndVerseId = parseIntOr(routeQuery.filterPassageEndVerseId, DEFAULT_PASSAGE_NOTES_QUERY.filterPassageEndVerseId);

  const hasPassageFilter = !!(filterPassageStartVerseId && filterPassageEndVerseId);
  const sortDefaults = defaultPassageNotesSort(hasPassageFilter);

  return {
    limit: clamp(parseIntOr(routeQuery.limit, DEFAULT_PASSAGE_NOTES_QUERY.limit), 1, MAX_PAGE_SIZE),
    offset: Math.max(0, parseIntOr(routeQuery.offset, DEFAULT_PASSAGE_NOTES_QUERY.offset)),
    sortOn: pickEnum(routeQuery.sortOn, SORT_ON_VALUES, sortDefaults.sortOn),
    sortDirection: pickEnum(routeQuery.sortDirection, SORT_DIRECTION_VALUES, sortDefaults.sortDirection),
    filterTags,
    filterTagMatching: pickEnum(routeQuery.filterTagMatching, ['any', 'all', 'exact'] as const, DEFAULT_PASSAGE_NOTES_QUERY.filterTagMatching),
    searchText: typeof routeQuery.searchText === 'string' ? routeQuery.searchText : `${routeQuery.searchText ?? DEFAULT_PASSAGE_NOTES_QUERY.searchText}`,
    filterPassageStartVerseId: (filterPassageStartVerseId && filterPassageEndVerseId) ? filterPassageStartVerseId : 0,
    filterPassageEndVerseId: (filterPassageStartVerseId && filterPassageEndVerseId) ? filterPassageEndVerseId : 0,
    filterPassageMatching: pickEnum(routeQuery.filterPassageMatching, ['inclusive', 'exclusive'] as const, DEFAULT_PASSAGE_NOTES_QUERY.filterPassageMatching),
  };
}

export function encodePassageNotesQueryToRoute(query: Partial<PassageNotesQuery> = {}): RouteQueryOut {
  const provided = query || {};
  // Callers that deep-link into /notes pass a passage filter and no sort at all
  // (see the book/Bible report pages), so the contextual default has to be layered
  // in before the caller's own values — otherwise an absent sort would resolve to
  // createdAt and get written into the URL as an override.
  const hasPassageFilter = !!(
    parseIntOr(provided.filterPassageStartVerseId, 0) && parseIntOr(provided.filterPassageEndVerseId, 0)
  );
  const sortDefaults = defaultPassageNotesSort(hasPassageFilter);

  const merged: PassageNotesQuery = { ...DEFAULT_PASSAGE_NOTES_QUERY, ...sortDefaults, ...provided };
  const normalized: PassageNotesQuery = {
    limit: clamp(parseIntOr(merged.limit, DEFAULT_PASSAGE_NOTES_QUERY.limit), 1, MAX_PAGE_SIZE),
    offset: Math.max(0, parseIntOr(merged.offset, DEFAULT_PASSAGE_NOTES_QUERY.offset)),
    sortOn: pickEnum(merged.sortOn, SORT_ON_VALUES, sortDefaults.sortOn),
    sortDirection: pickEnum(merged.sortDirection, SORT_DIRECTION_VALUES, sortDefaults.sortDirection),
    filterTags: Array.isArray(merged.filterTags) ? merged.filterTags : [],
    filterTagMatching: pickEnum(merged.filterTagMatching, ['any', 'all', 'exact'] as const, DEFAULT_PASSAGE_NOTES_QUERY.filterTagMatching),
    searchText: typeof merged.searchText === 'string' ? merged.searchText : `${merged.searchText ?? ''}`,
    filterPassageStartVerseId: parseIntOr(merged.filterPassageStartVerseId, 0),
    filterPassageEndVerseId: parseIntOr(merged.filterPassageEndVerseId, 0),
    filterPassageMatching: pickEnum(merged.filterPassageMatching, ['inclusive', 'exclusive'] as const, DEFAULT_PASSAGE_NOTES_QUERY.filterPassageMatching),
  };

  const out: RouteQueryOut = {};

  if (normalized.limit !== DEFAULT_PASSAGE_NOTES_QUERY.limit) {
    out.limit = `${normalized.limit}`;
  }
  if (normalized.offset !== DEFAULT_PASSAGE_NOTES_QUERY.offset) {
    out.offset = `${normalized.offset}`;
  }
  if (normalized.sortOn !== sortDefaults.sortOn) {
    out.sortOn = normalized.sortOn;
  }
  if (normalized.sortDirection !== sortDefaults.sortDirection) {
    out.sortDirection = normalized.sortDirection;
  }

  const trimmedSearchText = `${normalized.searchText}`.trim();
  if (trimmedSearchText) {
    out.searchText = trimmedSearchText;
  }

  if (normalized.filterTags.length) {
    out.filterTags = normalized.filterTags.map(v => `${v}`);
  }

  if (
    normalized.filterTagMatching !== DEFAULT_PASSAGE_NOTES_QUERY.filterTagMatching ||
    (normalized.filterTagMatching === 'exact' && normalized.filterTags.length === 0)
  ) {
    out.filterTagMatching = normalized.filterTagMatching;
  }

  if (hasPassageFilter) {
    out.filterPassageStartVerseId = `${normalized.filterPassageStartVerseId}`;
    out.filterPassageEndVerseId = `${normalized.filterPassageEndVerseId}`;
    if (normalized.filterPassageMatching !== DEFAULT_PASSAGE_NOTES_QUERY.filterPassageMatching) {
      out.filterPassageMatching = normalized.filterPassageMatching;
    }
  }

  return out;
}

export function defaultPassageNotesQuery(): PassageNotesQuery {
  return JSON.parse(JSON.stringify(DEFAULT_PASSAGE_NOTES_QUERY)) as PassageNotesQuery;
}
