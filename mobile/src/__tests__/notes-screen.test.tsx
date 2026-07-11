// Capture the focus effect so the test can simulate focus/blur transitions.
let mockFocusEffectCallback: (() => void | (() => void)) | null = null;
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useFocusEffect: (cb: () => void | (() => void)) => {
    mockFocusEffectCallback = cb;
  },
}));
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

import { act, fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import type { PassageNote } from "@/src/api/notesApi";
import { fetchNotesPage } from "@/src/api/notesApi";
import { initialNotesQuery, notesActions, useNotesStore } from "@/src/stores/passageNotes";
import { useTagsStore } from "@/src/stores/passageNoteTags";
import Notes from "@/app/(tabs)/notes/index";

function setNotes(notes: PassageNote[], totalSize = notes.length) {
  useNotesStore.setState({
    state: { status: "ready", notes, totalSize, isFetchingMore: false },
  });
}

beforeEach(() => {
  mockFocusEffectCallback = null;
  (fetchNotesPage as jest.Mock).mockClear();
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

  it("shows the error state with a translated message and a retry action", () => {
    useNotesStore.setState({ state: { status: "error", code: "network_error" } });
    const { getByText } = renderWithProviders(<Notes />);
    expect(getByText("Unable to load notes")).toBeTruthy();
    expect(
      getByText("Can't reach the server. Please check your connection and try again.")
    ).toBeTruthy();
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

  it("clears applied view options when the screen loses focus", async () => {
    setNotes([]);
    useNotesStore.setState({
      query: { ...initialNotesQuery, filterTags: [], searchText: "beginning" },
    });
    renderWithProviders(<Notes />);

    let cleanup: void | (() => void);
    act(() => {
      cleanup = mockFocusEffectCallback?.();
    });
    await act(async () => {
      if (typeof cleanup === "function") cleanup();
    });

    await waitFor(() => {
      expect(useNotesStore.getState().query).toEqual(initialNotesQuery);
    });
    expect(fetchNotesPage).toHaveBeenCalled();
  });

  it("does not reload on blur when no view options are applied", async () => {
    setNotes([]);
    renderWithProviders(<Notes />);

    let cleanup: void | (() => void);
    act(() => {
      cleanup = mockFocusEffectCallback?.();
    });
    await act(async () => {
      if (typeof cleanup === "function") cleanup();
    });

    expect(fetchNotesPage).not.toHaveBeenCalled();
  });

  it("keeps a deep-link passage filter set after the previous blur reset", async () => {
    setNotes([]);
    renderWithProviders(<Notes />);

    // Leave the tab with no filters applied (blur is a no-op)...
    let cleanup: void | (() => void);
    act(() => {
      cleanup = mockFocusEffectCallback?.();
    });
    await act(async () => {
      if (typeof cleanup === "function") cleanup();
    });

    // ...then openNotesForRange sets a passage filter before pushing the tab.
    await act(async () => {
      await notesActions.resetQuery({
        filterPassageStartVerseId: 101001001,
        filterPassageEndVerseId: 101050026,
        filterPassageMatching: "exclusive",
      });
    });

    // Re-focusing the screen must not clear the deep-link filter.
    act(() => {
      mockFocusEffectCallback?.();
    });
    expect(useNotesStore.getState().query.filterPassageStartVerseId).toBe(101001001);
    expect(useNotesStore.getState().query.filterPassageEndVerseId).toBe(101050026);
  });
});
