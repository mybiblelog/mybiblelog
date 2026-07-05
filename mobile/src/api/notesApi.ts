import { httpClient } from "@/src/api/httpClient";

export type NotePassage = { startVerseId: number; endVerseId: number };

export type PassageNote = {
  id: string;
  content: string;
  passages: NotePassage[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type NotesSortDirection = "ascending" | "descending";
export type TagMatching = "any" | "all" | "exact";
export type PassageMatching = "inclusive" | "exclusive";

export type NotesQuery = {
  limit: number;
  offset: number;
  sortOn: "createdAt";
  sortDirection: NotesSortDirection;
  filterTags: string[];
  filterTagMatching: TagMatching;
  searchText: string;
  filterPassageStartVerseId: number;
  filterPassageEndVerseId: number;
  filterPassageMatching: PassageMatching;
};

export type NotesPageMeta = { offset: number; limit: number; size: number };

export type NoteInput = {
  content: string;
  passages: NotePassage[];
  tags: string[];
};

// Mirrors the web store's query serialization (nuxt4/app/stores/passage-notes.ts):
// filterTags repeats as multiple params, and the passage filter params are only
// sent as a valid pair.
export function buildNotesQueryString(query: NotesQuery): string {
  const params = new URLSearchParams();

  for (const filterTag of query.filterTags) {
    params.append("filterTags", `${filterTag}`);
  }
  if (query.searchText) params.set("searchText", query.searchText);
  if (query.filterTagMatching) params.set("filterTagMatching", query.filterTagMatching);
  if (query.filterPassageStartVerseId && query.filterPassageEndVerseId) {
    params.set("filterPassageStartVerseId", `${query.filterPassageStartVerseId}`);
    params.set("filterPassageEndVerseId", `${query.filterPassageEndVerseId}`);
    if (query.filterPassageMatching) {
      params.set("filterPassageMatching", query.filterPassageMatching);
    }
  }
  if (query.sortOn) params.set("sortOn", query.sortOn);
  if (query.sortDirection) params.set("sortDirection", query.sortDirection);
  if (query.limit) params.set("limit", `${query.limit}`);
  if (query.offset) params.set("offset", `${query.offset}`);

  const out = params.toString();
  return out ? `?${out}` : "";
}

function toPassage(value: unknown): NotePassage | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const startVerseId = Number(v.startVerseId);
  const endVerseId = Number(v.endVerseId);
  if (!Number.isFinite(startVerseId) || !Number.isFinite(endVerseId)) return null;
  return { startVerseId, endVerseId };
}

export function parseApiPassageNote(value: unknown): PassageNote | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.id === undefined || v.id === null) return null;
  const passages = Array.isArray(v.passages)
    ? v.passages.map(toPassage).filter((p): p is NotePassage => p !== null)
    : [];
  const tags = Array.isArray(v.tags) ? v.tags.map((tag) => String(tag)) : [];
  return {
    id: String(v.id),
    content: typeof v.content === "string" ? v.content : "",
    passages,
    tags,
    createdAt: typeof v.createdAt === "string" ? v.createdAt : undefined,
    updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : undefined,
  };
}

export function parseApiPassageNotes(value: unknown): PassageNote[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseApiPassageNote).filter((note): note is PassageNote => note !== null);
}

export async function fetchNotesPage(
  query: NotesQuery
): Promise<{ notes: PassageNote[]; meta: NotesPageMeta }> {
  const search = buildNotesQueryString(query);
  const { data, meta } = await httpClient.get<unknown>(`/api/passage-notes${search}`);
  const pagination =
    (meta as { pagination?: Partial<NotesPageMeta> } | undefined)?.pagination ?? {};
  return {
    notes: parseApiPassageNotes(data),
    meta: {
      offset: Number(pagination.offset || 0),
      limit: Number(pagination.limit || query.limit || 10),
      size: Number(pagination.size || 0),
    },
  };
}

/** Per-book note counts (web `BibleReport` badge data): bookIndex → count. */
export async function fetchBookNoteCounts(): Promise<Record<number, number>> {
  const { data } = await httpClient.get<unknown>("/api/passage-notes/count/books");
  const counts: Record<number, number> = {};
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const bookIndex = Number(key);
      const count = Number(value);
      if (Number.isFinite(bookIndex) && Number.isFinite(count)) counts[bookIndex] = count;
    }
  }
  return counts;
}

export async function createNote(input: NoteInput): Promise<PassageNote> {
  const { data } = await httpClient.post<unknown>("/api/passage-notes", input);
  const parsed = parseApiPassageNote(data);
  if (!parsed) throw new Error("POST /passage-notes returned unexpected payload");
  return parsed;
}

export async function updateNote(input: NoteInput & { id: string }): Promise<PassageNote> {
  const { data } = await httpClient.put<unknown>(`/api/passage-notes/${input.id}`, input);
  const parsed = parseApiPassageNote(data);
  if (!parsed) throw new Error("PUT /passage-notes returned unexpected payload");
  return parsed;
}

export async function deleteNote(id: string): Promise<boolean> {
  const { data } = await httpClient.delete<unknown>(`/api/passage-notes/${id}`);
  return Boolean(data);
}
