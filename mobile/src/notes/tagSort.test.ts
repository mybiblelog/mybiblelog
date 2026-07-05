import type { PassageNoteTag } from "@/src/api/tagsApi";
import { normalizeSortOrder, sortPassageNoteTags } from "@/src/notes/tagSort";

const tag = (overrides: Partial<PassageNoteTag>): PassageNoteTag => ({
  id: "id",
  label: "",
  color: "#000000",
  description: "",
  noteCount: 0,
  ...overrides,
});

describe("normalizeSortOrder", () => {
  it("passes through valid orders and falls back to label:ascending", () => {
    expect(normalizeSortOrder("color:hue")).toBe("color:hue");
    expect(normalizeSortOrder("bogus")).toBe("label:ascending");
    expect(normalizeSortOrder(undefined)).toBe("label:ascending");
  });
});

describe("sortPassageNoteTags", () => {
  it("sorts labels ignoring leading symbols and case", () => {
    const tags = [
      tag({ id: "1", label: "zeal" }),
      tag({ id: "2", label: "#Work" }),
      tag({ id: "3", label: "apple" }),
    ];
    const sorted = sortPassageNoteTags(tags, "label:ascending");
    expect(sorted.map((t) => t.label)).toEqual(["apple", "#Work", "zeal"]);
  });

  it("falls back to ObjectId timestamps for createdAt sorting", () => {
    // First 8 hex chars encode seconds since epoch.
    const older = tag({ id: "5f000000aaaaaaaaaaaaaaaa", label: "older" });
    const newer = tag({ id: "60000000aaaaaaaaaaaaaaaa", label: "newer" });
    const withDate = tag({ id: "3", label: "dated", createdAt: "2026-01-01T00:00:00.000Z" });

    const desc = sortPassageNoteTags([older, withDate, newer], "createdAt:descending");
    expect(desc.map((t) => t.label)).toEqual(["dated", "newer", "older"]);

    const asc = sortPassageNoteTags([withDate, newer, older], "createdAt:ascending");
    expect(asc.map((t) => t.label)).toEqual(["older", "newer", "dated"]);
  });

  it("sorts by note count with label tiebreak", () => {
    const tags = [
      tag({ id: "1", label: "b", noteCount: 2 }),
      tag({ id: "2", label: "a", noteCount: 2 }),
      tag({ id: "3", label: "c", noteCount: 9 }),
    ];
    const sorted = sortPassageNoteTags(tags, "noteCount:descending");
    expect(sorted.map((t) => t.label)).toEqual(["c", "a", "b"]);
  });

  it("sorts by hue with grays last", () => {
    const tags = [
      tag({ id: "1", label: "gray", color: "#808080" }),
      tag({ id: "2", label: "blue", color: "#0000ff" }),
      tag({ id: "3", label: "red", color: "#ff0000" }),
      tag({ id: "4", label: "short-green", color: "#0f0" }),
    ];
    const sorted = sortPassageNoteTags(tags, "color:hue");
    expect(sorted.map((t) => t.label)).toEqual(["red", "short-green", "blue", "gray"]);
  });
});
