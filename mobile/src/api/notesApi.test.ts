jest.mock("@/src/api/httpClient", () => ({
  httpClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

import { httpClient } from "@/src/api/httpClient";
import {
  buildNotesQueryString,
  createNote,
  defaultNotesSort,
  deleteNote,
  fetchBookNoteCounts,
  fetchNotesPage,
  parseApiPassageNote,
  updateNote,
  type NotesQuery,
} from "@/src/api/notesApi";

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

const baseQuery: NotesQuery = {
  limit: 10,
  offset: 0,
  sortOn: "createdAt",
  sortDirection: "descending",
  filterTags: [],
  filterTagMatching: "any",
  searchText: "",
  filterPassageStartVerseId: 0,
  filterPassageEndVerseId: 0,
  filterPassageMatching: "inclusive",
};

describe("buildNotesQueryString", () => {
  it("serializes the default query without filters", () => {
    const qs = buildNotesQueryString(baseQuery);
    expect(qs).toBe("?filterTagMatching=any&sortOn=createdAt&sortDirection=descending&limit=10");
  });

  it("repeats filterTags as multiple params", () => {
    const qs = buildNotesQueryString({ ...baseQuery, filterTags: ["a1", "b2"] });
    expect(qs).toContain("filterTags=a1");
    expect(qs).toContain("filterTags=b2");
  });

  it("includes searchText and offset when set", () => {
    const qs = buildNotesQueryString({ ...baseQuery, searchText: "grace", offset: 20 });
    expect(qs).toContain("searchText=grace");
    expect(qs).toContain("offset=20");
  });

  it("only sends passage params as a complete pair", () => {
    const missingEnd = buildNotesQueryString({ ...baseQuery, filterPassageStartVerseId: 1001001 });
    expect(missingEnd).not.toContain("filterPassageStartVerseId");
    expect(missingEnd).not.toContain("filterPassageMatching");

    const pair = buildNotesQueryString({
      ...baseQuery,
      filterPassageStartVerseId: 1001001,
      filterPassageEndVerseId: 1001031,
      filterPassageMatching: "exclusive",
    });
    expect(pair).toContain("filterPassageStartVerseId=1001001");
    expect(pair).toContain("filterPassageEndVerseId=1001031");
    expect(pair).toContain("filterPassageMatching=exclusive");
  });

  it("sends the passage sort", () => {
    const qs = buildNotesQueryString({
      ...baseQuery,
      sortOn: "passage",
      sortDirection: "ascending",
      filterPassageStartVerseId: 1001001,
      filterPassageEndVerseId: 1001031,
    });
    expect(qs).toContain("sortOn=passage");
    expect(qs).toContain("sortDirection=ascending");
  });
});

describe("defaultNotesSort", () => {
  it("is scripture order with a passage filter and newest-first without one", () => {
    expect(defaultNotesSort(true)).toEqual({ sortOn: "passage", sortDirection: "ascending" });
    expect(defaultNotesSort(false)).toEqual({
      sortOn: "createdAt",
      sortDirection: "descending",
    });
  });
});

describe("parseApiPassageNote", () => {
  it("parses a full note and normalizes ids to strings", () => {
    const note = parseApiPassageNote({
      id: 42,
      content: "hello",
      passages: [{ startVerseId: 1001001, endVerseId: 1001005 }],
      tags: [7, "abc"],
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(note).toEqual({
      id: "42",
      content: "hello",
      passages: [{ startVerseId: 1001001, endVerseId: 1001005 }],
      tags: ["7", "abc"],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: undefined,
    });
  });

  it("defaults missing fields and drops malformed passages", () => {
    const note = parseApiPassageNote({ id: "n1", passages: [{ startVerseId: "x" }, null] });
    expect(note).toEqual({
      id: "n1",
      content: "",
      passages: [],
      tags: [],
      createdAt: undefined,
      updatedAt: undefined,
    });
  });

  it("returns null for non-objects and notes without ids", () => {
    expect(parseApiPassageNote(null)).toBeNull();
    expect(parseApiPassageNote("nope")).toBeNull();
    expect(parseApiPassageNote({ content: "orphan" })).toBeNull();
  });
});

describe("fetchNotesPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses meta.pagination when present", async () => {
    mockedHttpClient.get.mockResolvedValue({
      data: [],
      meta: { pagination: { offset: 20, limit: 5, size: 50 } },
    });
    const { meta } = await fetchNotesPage({ ...baseQuery, limit: 10 });
    expect(meta).toEqual({ offset: 20, limit: 5, size: 50 });
  });

  it("falls back to query.limit and 0 when meta.pagination is absent", async () => {
    mockedHttpClient.get.mockResolvedValue({ data: [], meta: {} });
    const { meta } = await fetchNotesPage({ ...baseQuery, limit: 25 });
    expect(meta).toEqual({ offset: 0, limit: 25, size: 0 });
  });

  it("falls back to 10 when meta.pagination and query.limit are both absent", async () => {
    mockedHttpClient.get.mockResolvedValue({ data: [], meta: undefined });
    const { meta } = await fetchNotesPage({ ...baseQuery, limit: 0 });
    expect(meta).toEqual({ offset: 0, limit: 10, size: 0 });
  });
});

describe("fetchBookNoteCounts", () => {
  beforeEach(() => jest.clearAllMocks());

  it("maps numeric keys/values into a bookIndex -> count record", async () => {
    mockedHttpClient.get.mockResolvedValue({ data: { "1": 3, "2": "5", bad: 1, "3": "x" } });
    expect(await fetchBookNoteCounts()).toEqual({ 1: 3, 2: 5 });
  });

  it("returns an empty object for non-object data", async () => {
    mockedHttpClient.get.mockResolvedValue({ data: null });
    expect(await fetchBookNoteCounts()).toEqual({});
  });
});

describe("createNote", () => {
  beforeEach(() => jest.clearAllMocks());

  const input = { content: "hi", passages: [], tags: [] };

  it("returns the parsed note on success", async () => {
    mockedHttpClient.post.mockResolvedValue({ data: { id: "1", content: "hi" } });
    expect(await createNote(input)).toEqual(expect.objectContaining({ id: "1", content: "hi" }));
  });

  it("throws when the response fails parseApiPassageNote", async () => {
    mockedHttpClient.post.mockResolvedValue({ data: null });
    await expect(createNote(input)).rejects.toThrow(
      "POST /passage-notes returned unexpected payload"
    );
  });
});

describe("updateNote", () => {
  beforeEach(() => jest.clearAllMocks());

  const input = { id: "1", content: "hi", passages: [], tags: [] };

  it("returns the parsed note on success", async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: { id: "1", content: "hi" } });
    expect(await updateNote(input)).toEqual(expect.objectContaining({ id: "1", content: "hi" }));
  });

  it("throws when the response fails parseApiPassageNote", async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: { content: "orphan" } });
    await expect(updateNote(input)).rejects.toThrow(
      "PATCH /passage-notes returned unexpected payload"
    );
  });
});

describe("deleteNote", () => {
  beforeEach(() => jest.clearAllMocks());

  it("coerces a truthy data field to true", async () => {
    mockedHttpClient.delete.mockResolvedValue({ data: { ok: true } });
    expect(await deleteNote("1")).toBe(true);
  });

  it("coerces a falsy data field to false", async () => {
    mockedHttpClient.delete.mockResolvedValue({ data: undefined });
    expect(await deleteNote("1")).toBe(false);
  });
});
