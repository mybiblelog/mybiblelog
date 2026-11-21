import type { Ref } from 'vue';
import { Bible } from '@mybiblelog/shared';
import type { LogEntriesQuery } from '~/helpers/log-entries-route-query';

type LogEntryLike = {
  id: number | string;
  date: string;
  startVerseId: number;
  endVerseId: number;
};

function stableCompare(a: string | number, b: string | number): number {
  if (a === b) { return 0; }
  return a < b ? -1 : 1;
}

function filterAndSort<E extends LogEntryLike>(entries: E[], q: Partial<LogEntriesQuery>): E[] {
  const startDate = `${q.startDate || ''}`.trim();
  const endDate = `${q.endDate || ''}`.trim();
  const filterRange = q.filterPassageStartVerseId && q.filterPassageEndVerseId
    ? { startVerseId: Number(q.filterPassageStartVerseId), endVerseId: Number(q.filterPassageEndVerseId) }
    : null;

  const filtered = entries.filter((entry) => {
    if (startDate && entry.date < startDate) { return false; }
    if (endDate && entry.date > endDate) { return false; }
    if (filterRange && !Bible.checkRangeOverlap(entry, filterRange)) { return false; }
    return true;
  });

  const direction = q.sortDirection === 'ascending' ? 1 : -1;
  return filtered.sort((a, b) =>
    stableCompare(a.date, b.date) * direction
    || stableCompare(Number(a.startVerseId), Number(b.startVerseId))
    || stableCompare(Number(a.endVerseId), Number(b.endVerseId))
    || stableCompare(`${a.id}`, `${b.id}`),
  );
}

/**
 * Page boundaries never split a day: each page holds at least `limit` entries
 * (or the remainder), extended to the end of its last day.
 */
function pageStartOffsets(entries: LogEntryLike[], limit: number): number[] {
  const starts = [0];
  let count = 0;
  for (let i = 1; i < entries.length; i++) {
    count += 1;
    if (count >= limit && entries[i]!.date !== entries[i - 1]!.date) {
      starts.push(i);
      count = 0;
    }
  }
  return starts;
}

function groupByDate<E extends LogEntryLike>(entries: E[]): Array<{ date: string; entries: E[] }> {
  const groups: Array<{ date: string; entries: E[] }> = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) {
      last.entries.push(entry);
    }
    else {
      groups.push({ date: entry.date, entries: [entry] });
    }
  }
  return groups;
}

/**
 * Filters, sorts, and day-aligned-paginates log entries for the log page.
 * `query.offset` may point anywhere; it snaps to the start of the page that
 * contains it (`effectiveOffset`).
 */
export function useLogEntriesPaging<E extends LogEntryLike>(
  query: Ref<Partial<LogEntriesQuery>>,
  entries: Ref<E[]>,
) {
  const filteredSortedEntries = computed(() => filterAndSort(entries.value, query.value));
  const resultsSize = computed(() => filteredSortedEntries.value.length);
  const effectiveLimit = computed(() => Math.max(1, Number(query.value.limit || 10)));
  const pageStarts = computed(() => pageStartOffsets(filteredSortedEntries.value, effectiveLimit.value));

  const pageIndex = computed(() => {
    const requested = Math.max(0, Number(query.value.offset || 0));
    let idx = 0;
    while (idx + 1 < pageStarts.value.length && pageStarts.value[idx + 1]! <= requested) { idx += 1; }
    return idx;
  });

  const page = computed(() => pageIndex.value + 1);
  const totalPages = computed(() => pageStarts.value.length);
  const effectiveOffset = computed(() => pageStarts.value[pageIndex.value]!);

  const pagedEntries = computed(() => {
    const end = pageStarts.value[pageIndex.value + 1] ?? filteredSortedEntries.value.length;
    return filteredSortedEntries.value.slice(effectiveOffset.value, end);
  });

  const pagedEntryGroups = computed(() => groupByDate(pagedEntries.value));

  function offsetForPage(pageNumber: number): number {
    const clamped = Math.min(Math.max(Number(pageNumber || 1), 1), totalPages.value);
    return pageStarts.value[clamped - 1]!;
  }

  return {
    resultsSize,
    effectiveLimit,
    effectiveOffset,
    page,
    totalPages,
    pagedEntries,
    pagedEntryGroups,
    offsetForPage,
  };
}
