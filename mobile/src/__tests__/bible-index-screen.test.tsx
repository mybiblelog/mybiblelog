jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  // No navigation container in tests: run the focus effect as a plain effect.
  useFocusEffect: (cb: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(cb, [cb]);
  },
}));
jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  fetchBookNoteCounts: jest.fn().mockResolvedValue({}),
  fetchNotesPage: jest
    .fn()
    .mockResolvedValue({ notes: [], meta: { offset: 0, limit: 10, size: 0 } }),
}));

import { computeBibleProgress } from "@mybiblelog/shared";
import { router } from "expo-router";
import { fetchBookNoteCounts } from "@/src/api/notesApi";
import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useBibleProgressStore } from "@/src/stores/bibleProgress";
import { useNoteCountsStore } from "@/src/stores/passageNoteCounts";
import { useNotesStore } from "@/src/stores/passageNotes";
import BibleIndex from "@/app/(tabs)/bible/index";

beforeEach(() => {
  useBibleProgressStore.setState({ progress: computeBibleProgress([]), jobs: 0 });
  useNoteCountsStore.setState({ counts: null });
  (router.push as jest.Mock).mockClear();
});

describe("Bible Books screen", () => {
  it("hides note badges before any book has notes", () => {
    useNoteCountsStore.setState({ counts: { 1: 0, 2: 0 } });
    const { queryByText, getAllByText } = renderWithProviders(<BibleIndex />);
    // Hidden from accessibility (and from a default query), but not unmounted:
    // it stays in the tree at zero opacity so its layout space is reserved.
    expect(queryByText("0 notes")).toBeNull();
    const badges = getAllByText("0 notes", { includeHiddenElements: true });
    expect(badges.length).toBeGreaterThan(0);
    for (const badge of badges) {
      // badge -> host Text -> RN's Text wrapper -> our `Text` atom -> badge View.
      const badgeContainer = badge.parent!.parent!.parent!;
      expect(badgeContainer).toHaveProp("accessibilityElementsHidden", true);
      expect(badgeContainer).toHaveStyle({ opacity: 0 });
    }
  });

  it("shows per-book badges once any book has notes", () => {
    useNoteCountsStore.setState({ counts: { 1: 2, 43: 1 } });
    const { getByText, getAllByText } = renderWithProviders(<BibleIndex />);
    expect(getByText("2 notes")).toBeTruthy();
    // Web parity: every rendered row shows its badge, including zero counts.
    expect(getAllByText("0 notes").length).toBeGreaterThan(0);
  });

  it("refreshes the counts when the screen gains focus", async () => {
    renderWithProviders(<BibleIndex />);
    await waitFor(() => expect(fetchBookNoteCounts).toHaveBeenCalled());
  });

  it("navigates to the book when the badge is pressed, without filtering the notes tab", () => {
    useNoteCountsStore.setState({ counts: { 1: 2 } });
    const { getByText } = renderWithProviders(<BibleIndex />);

    fireEvent.press(getByText("2 notes"));

    // The badge is a plain label, not a link: the press falls through to the row.
    expect(router.push).toHaveBeenCalledWith("/bible/1");
    const query = useNotesStore.getState().query;
    expect(query.filterPassageStartVerseId).toBe(0);
    expect(query.filterPassageEndVerseId).toBe(0);
  });

  it("navigates to the book when the row itself is pressed", () => {
    useNoteCountsStore.setState({ counts: { 1: 2 } });
    const { getByText } = renderWithProviders(<BibleIndex />);
    fireEvent.press(getByText("Genesis"));
    expect(router.push).toHaveBeenCalledWith("/bible/1");
  });

  it("navigates to the Progress page from the header link", () => {
    const { getByText } = renderWithProviders(<BibleIndex />);
    fireEvent.press(getByText("Progress"));
    expect(router.push).toHaveBeenCalledWith("/bible/progress");
  });
});
