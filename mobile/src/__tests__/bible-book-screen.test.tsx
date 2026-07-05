jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ book: "64" }),
  // Render the header-right button inline so the book menu is reachable
  // without a real navigator.
  Stack: {
    Screen: ({ options }: { options?: { headerRight?: () => React.ReactNode } }) =>
      options?.headerRight?.() ?? null,
  },
}));
jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  fetchNotesPage: jest
    .fn()
    .mockResolvedValue({ notes: [], meta: { offset: 0, limit: 10, size: 0 } }),
  fetchBookNoteCounts: jest.fn().mockResolvedValue({}),
  createNote: jest.fn(),
}));
jest.mock("@/src/api/tagsApi", () => ({
  ...jest.requireActual("@/src/api/tagsApi"),
  fetchTags: jest.fn().mockResolvedValue([]),
}));

import type React from "react";
import { Bible, computeBibleProgress } from "@mybiblelog/shared";
import { router } from "expo-router";
import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useBibleProgressStore } from "@/src/stores/bibleProgress";
import { useNotesStore, initialNotesQuery } from "@/src/stores/passageNotes";
import { useUserSettingsStore } from "@/src/stores/userSettings";
import BibleBookScreen from "@/app/(tabs)/bible/[book]";

// Book 64 (3 John) has a single chapter, keeping the grid tiny.
const BOOK_INDEX = 64;

beforeEach(() => {
  useBibleProgressStore.setState({ progress: computeBibleProgress([]), jobs: 0 });
  useUserSettingsStore.setState({
    state: {
      status: "ready",
      settings: {
        lookBackDate: "2026-01-01",
        dailyVerseCountGoal: 86,
        preferredBibleVersion: "kjv",
        preferredBibleApp: "",
      },
      isRefreshingFromServer: false,
    },
  });
  useNotesStore.setState({
    state: { status: "idle" },
    query: { ...initialNotesQuery, filterTags: [] },
  });
  (router.push as jest.Mock).mockClear();
});

function openChapterMenu(utils: ReturnType<typeof renderWithProviders>) {
  // The chapter tile's a11y label comes from chapter_unread_a11y.
  fireEvent.press(utils.getByLabelText("3 John chapter 1, not read"));
}

describe("Bible book screen", () => {
  it("offers take-note and view-notes on a chapter", () => {
    const utils = renderWithProviders(<BibleBookScreen />);
    openChapterMenu(utils);
    expect(utils.getByText("Take note")).toBeTruthy();
    expect(utils.getByText("View notes")).toBeTruthy();
  });

  it("take note on a chapter opens the editor prefilled with the chapter passage", () => {
    const utils = renderWithProviders(<BibleBookScreen />);
    openChapterMenu(utils);

    fireEvent.press(utils.getByText("Take note"));

    expect(utils.getByText("New Note")).toBeTruthy();
    const start = Bible.makeVerseId(BOOK_INDEX, 1, 1);
    const end = Bible.makeVerseId(BOOK_INDEX, 1, Bible.getChapterVerseCount(BOOK_INDEX, 1));
    expect(utils.getByText(Bible.displayVerseRange(start, end))).toBeTruthy();
  });

  it("view notes on a chapter filters inclusively and navigates", () => {
    const utils = renderWithProviders(<BibleBookScreen />);
    openChapterMenu(utils);

    fireEvent.press(utils.getByText("View notes"));

    const query = useNotesStore.getState().query;
    expect(query.filterPassageStartVerseId).toBe(Bible.makeVerseId(BOOK_INDEX, 1, 1));
    expect(query.filterPassageMatching).toBe("inclusive");
    expect(router.push).toHaveBeenCalledWith("/(tabs)/notes");
  });

  it("the book menu offers take-note and view-notes for the whole book", () => {
    const utils = renderWithProviders(<BibleBookScreen />);
    fireEvent.press(utils.getByLabelText("Book actions"));

    fireEvent.press(utils.getByText("View notes"));

    const query = useNotesStore.getState().query;
    expect(query.filterPassageStartVerseId).toBe(Bible.getFirstBookVerseId(BOOK_INDEX));
    expect(query.filterPassageEndVerseId).toBe(Bible.getLastBookVerseId(BOOK_INDEX));
    expect(query.filterPassageMatching).toBe("exclusive");
    expect(router.push).toHaveBeenCalledWith("/(tabs)/notes");
  });

  it("take note on the book prefills the whole-book passage", () => {
    const utils = renderWithProviders(<BibleBookScreen />);
    fireEvent.press(utils.getByLabelText("Book actions"));

    fireEvent.press(utils.getByText("Take note"));

    expect(utils.getByText("New Note")).toBeTruthy();
    expect(
      utils.getByText(
        Bible.displayVerseRange(
          Bible.getFirstBookVerseId(BOOK_INDEX),
          Bible.getLastBookVerseId(BOOK_INDEX)
        )
      )
    ).toBeTruthy();
  });
});
