jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  fetchNotesPage: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  fetchBookNoteCounts: jest.fn(),
}));

import { ApiError } from "@/src/api/apiError";
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

  it("enters the error state with a generic code for a non-API failure", async () => {
    (fetchNotesPage as jest.Mock).mockRejectedValue(new Error("boom"));
    await actions().loadFirstPage();
    expect(useNotesStore.getState().state).toEqual({ status: "error", code: "unknown_error" });
  });

  it("carries the ApiError code into the error state", async () => {
    (fetchNotesPage as jest.Mock).mockRejectedValue(
      new ApiError({ code: "network_error", errors: [] })
    );
    await actions().loadFirstPage();
    expect(useNotesStore.getState().state).toEqual({ status: "error", code: "network_error" });
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

  it("stops paging when a full page adds no new notes (stale/overcounted size)", async () => {
    // A full page (== limit) whose rows are all already loaded: the server's
    // `size` overcounts what it can return, so without clamping this would loop
    // forever re-requesting the same offset.
    const loaded = Array.from({ length: 10 }, (_, i) => note(`${i + 1}`));
    (fetchNotesPage as jest.Mock).mockResolvedValue(page(loaded, 15, 10));
    useNotesStore.setState({
      state: { status: "ready", notes: loaded, totalSize: 15, isFetchingMore: false },
    });

    await actions().loadMore();

    const state = useNotesStore.getState().state;
    expect(state.status === "ready" && state.notes.length).toBe(10);
    expect(state.status === "ready" && state.totalSize).toBe(10);

    // A second trigger (e.g. onEndReached re-firing) must not fetch again.
    await actions().loadMore();
    expect(fetchNotesPage).toHaveBeenCalledTimes(1);
  });

  it("stops paging on a short page even if size claims there is more", async () => {
    (fetchNotesPage as jest.Mock).mockResolvedValue(page([note("3")], 9, 2));
    useNotesStore.setState({
      state: {
        status: "ready",
        notes: [note("1"), note("2")],
        totalSize: 9,
        isFetchingMore: false,
      },
    });

    await actions().loadMore();

    const state = useNotesStore.getState().state;
    expect(state.status === "ready" && state.notes.map((n) => n.id)).toEqual(["1", "2", "3"]);
    expect(state.status === "ready" && state.totalSize).toBe(3);

    await actions().loadMore();
    expect(fetchNotesPage).toHaveBeenCalledTimes(1);
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
