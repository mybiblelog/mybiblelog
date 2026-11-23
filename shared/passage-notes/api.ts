import type { HttpClient } from '../platform/http-client.js';

export type NotePassage = { startVerseId: number; endVerseId: number };

export type PassageNote = {
  id: string;
  content: string;
  passages: NotePassage[];
  tags: string[];
  // Present on list/search results; omitted from the single-note create/update
  // responses (see `toPassageNoteJSON` on the API side).
  createdAt?: string;
  updatedAt?: string;
};

export type PassageNoteInput = {
  content: string;
  passages: NotePassage[];
  tags: string[];
};

export type UpdatePassageNoteInput = Partial<PassageNoteInput> & { id: string };

export type PassageNotesSortDirection = 'ascending' | 'descending';
/**
 * `passage` orders notes by the earliest of their passages overlapping the
 * passage filter (or, with no filter, their earliest passage overall).
 */
export type PassageNotesSortOn = 'createdAt' | 'passage';
export type PassageNotesTagMatching = 'any' | 'all' | 'exact';
export type PassageNotesPassageMatching = 'inclusive' | 'exclusive';

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

export type PassageNotesPageMeta = { offset: number; limit: number; size: number };

/**
 * Sorting defaults to scripture order whenever a passage filter is in effect —
 * reading order is the point of a passage-scoped list.
 */
export function defaultPassageNotesSort(hasPassageFilter: boolean): {
  sortOn: PassageNotesSortOn;
  sortDirection: PassageNotesSortDirection;
} {
  return hasPassageFilter
    ? { sortOn: 'passage', sortDirection: 'ascending' }
    : { sortOn: 'createdAt', sortDirection: 'descending' };
}

// The passage filter params are only sent as a valid pair.
export function buildPassageNotesQueryString(query: Partial<PassageNotesQuery>): string {
  const params = new URLSearchParams();

  for (const filterTag of query.filterTags ?? []) {
    params.append('filterTags', `${filterTag}`);
  }
  if (query.searchText) { params.set('searchText', query.searchText); }
  if (query.filterTagMatching) { params.set('filterTagMatching', query.filterTagMatching); }
  // TECH-DEBT(usfm-client-migration): send USFM `filterPassage` instead of the verse id pair.
  if (query.filterPassageStartVerseId && query.filterPassageEndVerseId) {
    params.set('filterPassageStartVerseId', `${query.filterPassageStartVerseId}`);
    params.set('filterPassageEndVerseId', `${query.filterPassageEndVerseId}`);
    if (query.filterPassageMatching) {
      params.set('filterPassageMatching', query.filterPassageMatching);
    }
  }
  if (query.sortOn) { params.set('sortOn', query.sortOn); }
  if (query.sortDirection) { params.set('sortDirection', query.sortDirection); }
  if (query.limit) { params.set('limit', `${query.limit}`); }
  if (query.offset) { params.set('offset', `${query.offset}`); }

  const out = params.toString();
  return out ? `?${out}` : '';
}

const parseNotePassage = (value: unknown): NotePassage | null => {
  if (!value || typeof value !== 'object') { return null; }
  const v = value as Record<string, unknown>;
  const startVerseId = Number(v.startVerseId);
  const endVerseId = Number(v.endVerseId);
  if (!Number.isFinite(startVerseId) || !Number.isFinite(endVerseId)) { return null; }
  return { startVerseId, endVerseId };
};

export function parsePassageNote(value: unknown): PassageNote | null {
  if (!value || typeof value !== 'object') { return null; }
  const v = value as Record<string, unknown>;
  if (v.id === undefined || v.id === null) { return null; }
  const passages = Array.isArray(v.passages)
    ? v.passages.map(parseNotePassage).filter((p): p is NotePassage => p !== null)
    : [];
  const tags = Array.isArray(v.tags) ? v.tags.map(tag => String(tag)) : [];
  return {
    id: String(v.id),
    content: typeof v.content === 'string' ? v.content : '',
    passages,
    tags,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : undefined,
    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : undefined,
  };
}

export function parsePassageNotes(value: unknown): PassageNote[] {
  if (!Array.isArray(value)) { return []; }
  return value.map(parsePassageNote).filter((note): note is PassageNote => note !== null);
}

const requirePassageNote = (value: unknown, request: string): PassageNote => {
  const parsed = parsePassageNote(value);
  if (!parsed) { throw new Error(`${request} returned unexpected payload`); }
  return parsed;
};

export const fetchPassageNotesPage = async (
  http: HttpClient,
  query: Partial<PassageNotesQuery>,
): Promise<{ notes: PassageNote[]; meta: PassageNotesPageMeta }> => {
  const { data, meta } = await http.get<unknown>(`/api/passage-notes${buildPassageNotesQueryString(query)}`);
  const pagination = (meta as { pagination?: Partial<PassageNotesPageMeta> } | undefined)?.pagination ?? {};
  return {
    notes: parsePassageNotes(data),
    meta: {
      offset: Number(pagination.offset || 0),
      limit: Number(pagination.limit || query.limit || 10),
      size: Number(pagination.size || 0),
    },
  };
};

/** Per-book note counts: bookIndex → count. */
export const fetchBookNoteCounts = async (http: HttpClient): Promise<Record<number, number>> => {
  const { data } = await http.get<unknown>('/api/passage-notes/count/books');
  const counts: Record<number, number> = {};
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const bookIndex = Number(key);
      const count = Number(value);
      if (Number.isFinite(bookIndex) && Number.isFinite(count)) { counts[bookIndex] = count; }
    }
  }
  return counts;
};

// TECH-DEBT(usfm-client-migration): send USFM `passage` on each note passage instead of the verse id pair.
export const createPassageNote = async (
  http: HttpClient,
  input: Partial<PassageNoteInput>,
): Promise<PassageNote> => {
  const { data } = await http.post<unknown>('/api/passage-notes', input);
  return requirePassageNote(data, 'POST /passage-notes');
};

export const updatePassageNote = async (
  http: HttpClient,
  { id, ...input }: UpdatePassageNoteInput,
): Promise<PassageNote> => {
  const { data } = await http.patch<unknown>(`/api/passage-notes/${id}`, input);
  return requirePassageNote(data, 'PATCH /passage-notes');
};

export const deletePassageNote = async (http: HttpClient, id: string): Promise<boolean> => {
  const { data } = await http.delete<unknown>(`/api/passage-notes/${id}`);
  return Boolean(data);
};
