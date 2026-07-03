jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  fetchNotesPage: jest.fn().mockResolvedValue({
    notes: [],
    meta: { offset: 0, limit: 10, size: 0 },
  }),
}));
jest.mock("@/src/api/tagsApi", () => ({
  ...jest.requireActual("@/src/api/tagsApi"),
  fetchTags: jest.fn().mockResolvedValue([]),
}));

import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import type { PassageNote } from "@/src/api/notesApi";
import { initialNotesQuery, useNotesStore } from "@/src/stores/passageNotes";
import { useTagsStore } from "@/src/stores/passageNoteTags";
import Notes from "@/app/(tabs)/notes/index";

function setNotes(notes: PassageNote[], totalSize = notes.length) {
  useNotesStore.setState({
    state: { status: "ready", notes, totalSize, isFetchingMore: false },
  });
}

beforeEach(() => {
  useNotesStore.setState({
    state: { status: "idle" },
    query: { ...initialNotesQuery, filterTags: [] },
  });
  useTagsStore.setState({
    state: {
      status: "ready",
      tags: [{ id: "t1", label: "Prayer", color: "#00aaf9", description: "", noteCount: 1 }],
    },
    sortOrder: "label:ascending",
  });
});

describe("Notes screen", () => {
  it("shows a loading state while notes load", () => {
    useNotesStore.setState({ state: { status: "loading" } });
    const { getByText } = renderWithProviders(<Notes />);
    expect(getByText("Loading notes…")).toBeTruthy();
  });

  it("renders note cards with passages, content, and tag pills", () => {
    setNotes([
      {
        id: "n1",
        content: "In the beginning",
        passages: [{ startVerseId: 101001001, endVerseId: 101001005 }],
        tags: ["t1"],
      },
    ]);
    const { getByText } = renderWithProviders(<Notes />);
    expect(getByText("Genesis 1:1-5")).toBeTruthy();
    expect(getByText("In the beginning")).toBeTruthy();
    expect(getByText("Prayer")).toBeTruthy();
    expect(getByText("1 of 1 notes loaded")).toBeTruthy();
  });

  it("shows the empty state with a create CTA when there are no notes", () => {
    setNotes([]);
    const { getByText } = renderWithProviders(<Notes />);
    expect(getByText("No notes found")).toBeTruthy();
  });

  it("shows the error state with a retry action", () => {
    useNotesStore.setState({ state: { status: "error", message: "boom" } });
    const { getByText } = renderWithProviders(<Notes />);
    expect(getByText("Unable to load notes")).toBeTruthy();
    expect(getByText("Retry")).toBeTruthy();
  });

  it("opens the note editor from the New button", () => {
    setNotes([]);
    const { getByText, getAllByText } = renderWithProviders(<Notes />);
    fireEvent.press(getAllByText("New")[0]);
    expect(getByText("New Note")).toBeTruthy();
    expect(getByText("Add Passage")).toBeTruthy();
    expect(getByText("Choose Tags")).toBeTruthy();
  });

  it("opens the card menu with edit and delete actions", () => {
    setNotes([
      {
        id: "n1",
        content: "A note",
        passages: [],
        tags: [],
      },
    ]);
    const { getByLabelText, getByText } = renderWithProviders(<Notes />);
    fireEvent.press(getByLabelText("Note actions"));
    expect(getByText("Edit")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
  });

  it("opens the query sheet from the search button", () => {
    setNotes([]);
    const { getByText, getAllByText } = renderWithProviders(<Notes />);
    fireEvent.press(getAllByText("Search · Filter · Sort")[0]);
    expect(getByText("Apply")).toBeTruthy();
    expect(getByText("Only untagged notes")).toBeTruthy();
    expect(getByText("Newest First")).toBeTruthy();
  });
});
