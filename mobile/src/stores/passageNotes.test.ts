jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  fetchNotesPage: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  fetchBookNoteCounts: jest.fn(),
}));

import {
  createNote,
  deleteNote,
  fetchBookNoteCounts,
  fetchNotesPage,
  type PassageNote,
} from "@/src/api/notesApi";
import { initialNotesQuery, useNotesStore } from "./passageNotes";

const actions = () => useNotesStore.getState();

const note = (id: string): PassageNote => ({
  id,
  content: `note ${id}`,
  passages: [],
  tags: [],
});

const page = (notes: PassageNote[], size: number, offset = 0) => ({
  notes,
  meta: { offset, limit: 10, size },
});

beforeEach(() => {
  useNotesStore.setState({
    state: { status: "idle" },
    query: { ...initialNotesQuery, filterTags: [] },
  });
  (fetchBookNoteCounts as jest.Mock).mockReset().mockResolvedValue({});
});

describe("loadFirstPage", () => {
  it("replaces the list and records the total size", async () => {
    (fetchNotesPage as jest.Mock).mockResolvedValue(page([note("1"), note("2")], 5));
    await actions().loadFirstPage();
    expect(useNotesStore.getState().state).toEqual({
      status: "ready",
      notes: [note("1"), note("2")],
      totalSize: 5,
      isFetchingMore: false,
    });
  });

  it("enters the error state on failure", async () => {
    (fetchNotesPage as jest.Mock).mockRejectedValue(new Error("boom"));
    await actions().loadFirstPage();
    expect(useNotesStore.getState().state).toEqual({ status: "error", message: "boom" });
  });
});

describe("applyQuery", () => {
  it("merges the update, resets the offset, and reloads", async () => {
    (fetchNotesPage as jest.Mock).mockResolvedValue(page([], 0));
    useNotesStore.setState({ query: { ...initialNotesQuery, offset: 20 } });

    await actions().applyQuery({ searchText: "grace" });

    const { query } = useNotesStore.getState();
    expect(query.searchText).toBe("grace");
    expect(query.offset).toBe(0);
    expect(fetchNotesPage).toHaveBeenCalledWith(
      expect.objectContaining({ searchText: "grace", offset: 0 })
    );
  });
});

describe("loadMore", () => {
  it("appends the next page using the loaded count as offset", async () => {
    (fetchNotesPage as jest.Mock).mockResolvedValue(page([note("3")], 3, 2));
    useNotesStore.setState({
      state: {
        status: "ready",
        notes: [note("1"), note("2")],
        totalSize: 3,
        isFetchingMore: false,
      },
    });

    await actions().loadMore();

    expect(fetchNotesPage).toHaveBeenCalledWith(expect.objectContaining({ offset: 2 }));
    const state = useNotesStore.getState().state;
    expect(state.status === "ready" && state.notes.map((n) => n.id)).toEqual(["1", "2", "3"]);
  });

  it("does nothing when all notes are loaded", async () => {
    useNotesStore.setState({
      state: { status: "ready", notes: [note("1")], totalSize: 1, isFetchingMore: false },
    });
    await actions().loadMore();
    expect(fetchNotesPage).not.toHaveBeenCalled();
  });

  it("skips duplicates when the list shifted while fetching", async () => {
    (fetchNotesPage as jest.Mock).mockResolvedValue(page([note("2"), note("3")], 3, 2));
    useNotesStore.setState({
      state: {
        status: "ready",
        notes: [note("1"), note("2")],
        totalSize: 3,
        isFetchingMore: false,
      },
    });

    await actions().loadMore();

    const state = useNotesStore.getState().state;
    expect(state.status === "ready" && state.notes.map((n) => n.id)).toEqual(["1", "2", "3"]);
  });
});

describe("mutations", () => {
  it("create reloads the first page", async () => {
    (createNote as jest.Mock).mockResolvedValue(note("9"));
    (fetchNotesPage as jest.Mock).mockResolvedValue(page([note("9")], 1));

    const created = await actions().create({ content: "note 9", passages: [], tags: [] });

    expect(created).toEqual(note("9"));
    expect(fetchNotesPage).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
  });

  it("remove reloads after a successful delete", async () => {
    (deleteNote as jest.Mock).mockResolvedValue(true);
    (fetchNotesPage as jest.Mock).mockResolvedValue(page([], 0));
    useNotesStore.setState({
      state: { status: "ready", notes: [note("1")], totalSize: 1, isFetchingMore: false },
    });

    const removed = await actions().remove("1");

    expect(removed).toBe(true);
    expect(fetchNotesPage).toHaveBeenCalled();
  });

  it("create and remove refresh the per-book note counts", async () => {
    (createNote as jest.Mock).mockResolvedValue(note("9"));
    (deleteNote as jest.Mock).mockResolvedValue(true);
    (fetchNotesPage as jest.Mock).mockResolvedValue(page([], 0));

    await actions().create({ content: "note 9", passages: [], tags: [] });
    expect(fetchBookNoteCounts).toHaveBeenCalledTimes(1);

    await actions().remove("9");
    expect(fetchBookNoteCounts).toHaveBeenCalledTimes(2);
  });

  it("does not refresh the counts when the mutation fails", async () => {
    (createNote as jest.Mock).mockRejectedValue(new Error("boom"));
    await actions().create({ content: "x", passages: [], tags: [] });
    expect(fetchBookNoteCounts).not.toHaveBeenCalled();
  });
});
