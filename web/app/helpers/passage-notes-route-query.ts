export type PassageNotesSortDirection = 'ascending' | 'descending';
export type PassageNotesTagMatching = 'any' | 'all' | 'exact';
export type PassageNotesPassageMatching = 'inclusive' | 'exclusive';

export type PassageNotesQuery = {
  limit: number;
  offset: number;
  sortOn: string;
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

const MAX_PAGE_SIZE = 50;

function asStringArray(value: unknown): string[] {
  if (value === null || value === undefined) { return []; }
  if (Array.isArray(value)) { return value.map(v => `${v}`); }
  if (`${value}`.trim() === '') { return []; }
  return [`${value}`];
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function parseIntOr(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(`${value}`, 10);
  return Number.isFinite(n) ? n : fallback;
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const v = `${value ?? ''}` as T;
  return (allowed as readonly string[]).includes(v) ? v : fallback;
}

export function decodePassageNotesRouteQuery(routeQuery: RouteQueryLike = {}): PassageNotesQuery {
  const filterTags = asStringArray(routeQuery.filterTags)
    .map(v => `${v}`.trim())
    .filter(Boolean);

  const filterPassageStartVerseId = parseIntOr(routeQuery.filterPassageStartVerseId, DEFAULT_PASSAGE_NOTES_QUERY.filterPassageStartVerseId);
  const filterPassageEndVerseId = parseIntOr(routeQuery.filterPassageEndVerseId, DEFAULT_PASSAGE_NOTES_QUERY.filterPassageEndVerseId);

  return {
    limit: clamp(parseIntOr(routeQuery.limit, DEFAULT_PASSAGE_NOTES_QUERY.limit), 1, MAX_PAGE_SIZE),
    offset: Math.max(0, parseIntOr(routeQuery.offset, DEFAULT_PASSAGE_NOTES_QUERY.offset)),
    sortOn: `${routeQuery.sortOn ?? DEFAULT_PASSAGE_NOTES_QUERY.sortOn}`,
    sortDirection: pickEnum(routeQuery.sortDirection, ['ascending', 'descending'] as const, DEFAULT_PASSAGE_NOTES_QUERY.sortDirection),
    filterTags,
    filterTagMatching: pickEnum(routeQuery.filterTagMatching, ['any', 'all', 'exact'] as const, DEFAULT_PASSAGE_NOTES_QUERY.filterTagMatching),
    searchText: typeof routeQuery.searchText === 'string' ? routeQuery.searchText : `${routeQuery.searchText ?? DEFAULT_PASSAGE_NOTES_QUERY.searchText}`,
    filterPassageStartVerseId: (filterPassageStartVerseId && filterPassageEndVerseId) ? filterPassageStartVerseId : 0,
    filterPassageEndVerseId: (filterPassageStartVerseId && filterPassageEndVerseId) ? filterPassageEndVerseId : 0,
    filterPassageMatching: pickEnum(routeQuery.filterPassageMatching, ['inclusive', 'exclusive'] as const, DEFAULT_PASSAGE_NOTES_QUERY.filterPassageMatching),
  };
}

export function encodePassageNotesQueryToRoute(query: Partial<PassageNotesQuery> = {}): RouteQueryOut {
  const merged: PassageNotesQuery = { ...DEFAULT_PASSAGE_NOTES_QUERY, ...(query || {}) };
  const normalized: PassageNotesQuery = {
    limit: clamp(parseIntOr(merged.limit, DEFAULT_PASSAGE_NOTES_QUERY.limit), 1, MAX_PAGE_SIZE),
    offset: Math.max(0, parseIntOr(merged.offset, DEFAULT_PASSAGE_NOTES_QUERY.offset)),
    sortOn: `${merged.sortOn ?? DEFAULT_PASSAGE_NOTES_QUERY.sortOn}`,
    sortDirection: pickEnum(merged.sortDirection, ['ascending', 'descending'] as const, DEFAULT_PASSAGE_NOTES_QUERY.sortDirection),
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
  if (normalized.sortOn !== DEFAULT_PASSAGE_NOTES_QUERY.sortOn) {
    out.sortOn = normalized.sortOn;
  }
  if (normalized.sortDirection !== DEFAULT_PASSAGE_NOTES_QUERY.sortDirection) {
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

  const hasPassageFilter = !!(normalized.filterPassageStartVerseId && normalized.filterPassageEndVerseId);
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
  return structuredClone(DEFAULT_PASSAGE_NOTES_QUERY) as PassageNotesQuery;
}
