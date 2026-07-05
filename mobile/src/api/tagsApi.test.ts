import { parseApiPassageNoteTag } from "@/src/api/tagsApi";

describe("parseApiPassageNoteTag", () => {
  it("parses a full tag and normalizes the id to a string", () => {
    expect(
      parseApiPassageNoteTag({
        id: 7,
        label: "Prayer",
        color: "#00aaf9",
        description: "d",
        noteCount: "3",
        createdAt: "2026-01-01T00:00:00.000Z",
      })
    ).toEqual({
      id: "7",
      label: "Prayer",
      color: "#00aaf9",
      description: "d",
      noteCount: 3,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("defaults missing fields", () => {
    expect(parseApiPassageNoteTag({ id: "a" })).toEqual({
      id: "a",
      label: "",
      color: "#000000",
      description: "",
      noteCount: 0,
      createdAt: undefined,
    });
  });

  it("returns null for non-objects and tags without ids", () => {
    expect(parseApiPassageNoteTag(null)).toBeNull();
    expect(parseApiPassageNoteTag({ label: "orphan" })).toBeNull();
  });
});
