jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  fetchNoteCountsByBook: jest.fn(),
}));

import { fetchNoteCountsByBook } from "@/src/api/notesApi";
import { selectAnyBookHasNotes, useNoteCountsStore } from "./passageNoteCounts";

beforeEach(() => {
  useNoteCountsStore.setState({ counts: null });
  (fetchNoteCountsByBook as jest.Mock).mockReset();
});

describe("refresh", () => {
  it("stores the fetched counts", async () => {
    (fetchNoteCountsByBook as jest.Mock).mockResolvedValue({ 1: 2, 43: 5 });
    await useNoteCountsStore.getState().refresh();
    expect(useNoteCountsStore.getState().counts).toEqual({ 1: 2, 43: 5 });
  });

  it("keeps the previous counts on failure", async () => {
    useNoteCountsStore.setState({ counts: { 1: 2 } });
    (fetchNoteCountsByBook as jest.Mock).mockRejectedValue(new Error("boom"));
    await useNoteCountsStore.getState().refresh();
    expect(useNoteCountsStore.getState().counts).toEqual({ 1: 2 });
  });
});

describe("selectAnyBookHasNotes", () => {
  it("is false before the first load", () => {
    expect(selectAnyBookHasNotes(null)).toBe(false);
  });

  it("is false when every book has zero notes", () => {
    expect(selectAnyBookHasNotes({ 1: 0, 2: 0 })).toBe(false);
  });

  it("is true when any book has notes", () => {
    expect(selectAnyBookHasNotes({ 1: 0, 2: 3 })).toBe(true);
  });
});
