jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  fetchNotesPage: jest
    .fn()
    .mockResolvedValue({ notes: [], meta: { offset: 0, limit: 10, size: 0 } }),
}));

import { router } from "expo-router";
import { initialNotesQuery, useNotesStore } from "@/src/stores/passageNotes";
import { openNotesForRange } from "./openNotesForRange";

beforeEach(() => {
  useNotesStore.setState({
    state: { status: "idle" },
    query: { ...initialNotesQuery, filterTags: [] },
  });
  (router.push as jest.Mock).mockClear();
});

describe("openNotesForRange", () => {
  it("resets the query to the passage range and navigates to the notes tab", () => {
    openNotesForRange(1001001, 1050026, "exclusive");

    const query = useNotesStore.getState().query;
    expect(query.filterPassageStartVerseId).toBe(1001001);
    expect(query.filterPassageEndVerseId).toBe(1050026);
    expect(query.filterPassageMatching).toBe("exclusive");
    // A reset, not a merge: other options return to their defaults.
    expect(query.filterTags).toEqual([]);
    expect(query.searchText).toBe("");
    expect(router.push).toHaveBeenCalledWith("/(tabs)/notes");
  });

  it("defaults to inclusive matching (chapter View Notes)", () => {
    openNotesForRange(43003001, 43003036);
    expect(useNotesStore.getState().query.filterPassageMatching).toBe("inclusive");
  });
});
