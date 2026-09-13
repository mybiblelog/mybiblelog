import { Bible } from "@mybiblelog/shared";
import type { PassageNote } from "@/src/api/notesApi";
import { getNoteMenuTitle } from "@/src/notes/noteMenuTitle";

const note = (overrides: Partial<PassageNote>): PassageNote => ({
  id: "id",
  content: "",
  passages: [],
  tags: [],
  ...overrides,
});

// Genesis 1:1
const START = Bible.makeVerseId(1, 1, 1);
// Genesis 1:2
const END = Bible.makeVerseId(1, 1, 2);

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key;

describe("getNoteMenuTitle", () => {
  it("names the single passage", () => {
    const passage = Bible.displayVerseRange(START, END, "en");
    const result = getNoteMenuTitle(
      note({ passages: [{ startVerseId: START, endVerseId: END }] }),
      t,
      "en"
    );
    expect(result).toBe(`note_menu_title_passage:${JSON.stringify({ passage })}`);
  });

  it("uses only the first passage, marked as multiple", () => {
    const passage = Bible.displayVerseRange(START, END, "en");
    const result = getNoteMenuTitle(
      note({
        passages: [
          { startVerseId: START, endVerseId: END },
          { startVerseId: START, endVerseId: START },
        ],
      }),
      t,
      "en"
    );
    expect(result).toBe(`note_menu_title_passage_multiple:${JSON.stringify({ passage })}`);
  });

  it("names the created date when there are no passages", () => {
    const result = getNoteMenuTitle(
      note({ content: "Short note", createdAt: "2026-07-02T12:00:00.000Z" }),
      t,
      "en"
    );
    expect(result).toBe(`note_menu_title_date:${JSON.stringify({ date: "July 2, 2026" })}`);
  });

  it("returns undefined for a note with no passages and no created date", () => {
    expect(getNoteMenuTitle(note({ content: "Short note" }), t, "en")).toBeUndefined();
  });
});
