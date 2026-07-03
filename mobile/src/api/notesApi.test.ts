import { buildNotesQueryString, parseApiPassageNote, type NotesQuery } from "@/src/api/notesApi";

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
