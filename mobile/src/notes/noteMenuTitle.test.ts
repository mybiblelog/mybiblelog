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

  it("previews short content unmodified", () => {
    const result = getNoteMenuTitle(note({ content: "Short note" }), t, "en");
    expect(result).toBe(`note_menu_title_content:${JSON.stringify({ content: "Short note" })}`);
  });

  it("does not truncate content at exactly 30 characters", () => {
    const content = "x".repeat(30);
    const result = getNoteMenuTitle(note({ content }), t, "en");
    expect(result).toBe(`note_menu_title_content:${JSON.stringify({ content })}`);
  });

  it("truncates content over 30 characters with an ellipsis", () => {
    const content = "x".repeat(40);
    const result = getNoteMenuTitle(note({ content }), t, "en");
    expect(result).toBe(
      `note_menu_title_content:${JSON.stringify({ content: `${"x".repeat(30)}…` })}`
    );
  });

  it("returns undefined for a note with no passages and no content", () => {
    expect(getNoteMenuTitle(note({ content: "   " }), t, "en")).toBeUndefined();
  });
});
