import dayjs from 'dayjs';
import { clamp, parseIntOr, pickEnum, MAX_PAGE_SIZE } from './route-query-codec';

export type LogEntriesSortDirection = 'ascending' | 'descending';

export type LogEntriesQuery = {
  limit: number;
  offset: number;
  sortDirection: LogEntriesSortDirection;
  startDate: string; // inclusive; YYYY-MM-DD
  endDate: string; // inclusive; YYYY-MM-DD
  filterPassageStartVerseId: number;
  filterPassageEndVerseId: number;
};

type RouteQueryLike = Record<string, unknown>;
type RouteQueryOut = Record<string, string>;

const DEFAULT_LOG_ENTRIES_QUERY: LogEntriesQuery = {
  limit: 10,
  offset: 0,
  sortDirection: 'descending',
  startDate: '',
  endDate: '',
  filterPassageStartVerseId: 0,
  filterPassageEndVerseId: 0,
};

function normalizeDateString(value: unknown): string {
  const v = `${value ?? ''}`.trim();
  if (!v) { return ''; }
  return dayjs(v, 'YYYY-MM-DD', true).isValid() ? v : '';
}

export function decodeLogEntriesRouteQuery(routeQuery: RouteQueryLike = {}): LogEntriesQuery {
  const filterPassageStartVerseId = parseIntOr(routeQuery.filterPassageStartVerseId, DEFAULT_LOG_ENTRIES_QUERY.filterPassageStartVerseId);
  const filterPassageEndVerseId = parseIntOr(routeQuery.filterPassageEndVerseId, DEFAULT_LOG_ENTRIES_QUERY.filterPassageEndVerseId);

  return {
    limit: clamp(parseIntOr(routeQuery.limit, DEFAULT_LOG_ENTRIES_QUERY.limit), 1, MAX_PAGE_SIZE),
    offset: Math.max(0, parseIntOr(routeQuery.offset, DEFAULT_LOG_ENTRIES_QUERY.offset)),
    sortDirection: pickEnum(routeQuery.sortDirection, ['ascending', 'descending'] as const, DEFAULT_LOG_ENTRIES_QUERY.sortDirection),
    startDate: normalizeDateString(routeQuery.startDate),
    endDate: normalizeDateString(routeQuery.endDate),
    filterPassageStartVerseId: (filterPassageStartVerseId && filterPassageEndVerseId) ? filterPassageStartVerseId : 0,
    filterPassageEndVerseId: (filterPassageStartVerseId && filterPassageEndVerseId) ? filterPassageEndVerseId : 0,
  };
}

export function encodeLogEntriesQueryToRoute(query: Partial<LogEntriesQuery> = {}): RouteQueryOut {
  const merged: LogEntriesQuery = { ...DEFAULT_LOG_ENTRIES_QUERY, ...(query || {}) };
  const normalized: LogEntriesQuery = {
    limit: clamp(parseIntOr(merged.limit, DEFAULT_LOG_ENTRIES_QUERY.limit), 1, MAX_PAGE_SIZE),
    offset: Math.max(0, parseIntOr(merged.offset, DEFAULT_LOG_ENTRIES_QUERY.offset)),
    sortDirection: pickEnum(merged.sortDirection, ['ascending', 'descending'] as const, DEFAULT_LOG_ENTRIES_QUERY.sortDirection),
    startDate: normalizeDateString(merged.startDate),
    endDate: normalizeDateString(merged.endDate),
    filterPassageStartVerseId: parseIntOr(merged.filterPassageStartVerseId, 0),
    filterPassageEndVerseId: parseIntOr(merged.filterPassageEndVerseId, 0),
  };

  const out: RouteQueryOut = {};

  if (normalized.limit !== DEFAULT_LOG_ENTRIES_QUERY.limit) {
    out.limit = `${normalized.limit}`;
  }
  if (normalized.offset !== DEFAULT_LOG_ENTRIES_QUERY.offset) {
    out.offset = `${normalized.offset}`;
  }
  if (normalized.sortDirection !== DEFAULT_LOG_ENTRIES_QUERY.sortDirection) {
    out.sortDirection = normalized.sortDirection;
  }

  if (normalized.startDate) {
    out.startDate = normalized.startDate;
  }
  if (normalized.endDate) {
    out.endDate = normalized.endDate;
  }

  const hasPassageFilter = !!(normalized.filterPassageStartVerseId && normalized.filterPassageEndVerseId);
  if (hasPassageFilter) {
    out.filterPassageStartVerseId = `${normalized.filterPassageStartVerseId}`;
    out.filterPassageEndVerseId = `${normalized.filterPassageEndVerseId}`;
  }

  return out;
}

export function defaultLogEntriesQuery(): LogEntriesQuery {
  return JSON.parse(JSON.stringify(DEFAULT_LOG_ENTRIES_QUERY)) as LogEntriesQuery;
}
