// Capture the focus effect so the test can simulate focus/blur transitions.
let mockFocusEffectCallback: (() => void | (() => void)) | null = null;
jest.mock("expo-router", () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    mockFocusEffectCallback = cb;
  },
}));

import dayjs from "dayjs";
import { Bible, computeBibleProgress } from "@mybiblelog/shared";
import { act, fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useBibleProgressStore } from "@/src/stores/bibleProgress";
import { logEntryActions, useLogEntriesStore } from "@/src/stores/logEntries";
import { DEFAULT_BOOK_LIST_PREFS, useBookListPrefsStore } from "@/src/stores/bookListPrefs";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import Checklist from "@/app/(tabs)/checklist";

const GENESIS = 1;
const today = dayjs().format("YYYY-MM-DD");
const chapter1Start = Bible.makeVerseId(GENESIS, 1, 1);
const chapter1End = Bible.makeVerseId(GENESIS, 1, Bible.getChapterVerseCount(GENESIS, 1));

beforeEach(() => {
  useBookListPrefsStore.setState({ prefs: DEFAULT_BOOK_LIST_PREFS, touched: false });
  mockFocusEffectCallback = null;
  useBibleProgressStore.setState({ progress: computeBibleProgress([]), jobs: 0 });
  useLogEntriesStore.setState({ state: { status: "ready", entries: [], isSyncing: false } });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Checklist screen", () => {
  it("collapses expanded books when the screen loses focus", async () => {
    const { getByLabelText, queryByLabelText } = await renderWithProviders(<Checklist />);

    // Expand Genesis: its chapter cells appear.
    await fireEvent.press(getByLabelText("Genesis"));
    expect(getByLabelText("Genesis chapter 1, not read")).toBeTruthy();

    // Simulate focus, then blur (the focus effect's cleanup).
    let cleanup: void | (() => void);
    await act(() => {
      cleanup = mockFocusEffectCallback?.();
    });
    await act(() => {
      if (typeof cleanup === "function") cleanup();
    });

    expect(queryByLabelText("Genesis chapter 1, not read")).toBeNull();
  });

  it("sort toggle flips between traditional and alphabetical order", async () => {
    const { getByTestId, getAllByText } = await renderWithProviders(<Checklist />);
    const firstOf = () => getAllByText(/^(Acts|Genesis)$/)[0].props.children;
    const toggle = getByTestId("checklist.sort-toggle");

    expect(firstOf()).toBe("Genesis");
    expect(toggle).toHaveProp("accessibilityLabel", "Book order: Traditional");

    await fireEvent.press(toggle);
    expect(firstOf()).toBe("Acts");
    expect(getByTestId("checklist.sort-toggle")).toHaveProp(
      "accessibilityLabel",
      "Book order: Alphabetical"
    );

    await fireEvent.press(getByTestId("checklist.sort-toggle"));
    expect(firstOf()).toBe("Genesis");
  });

  // Mirrors the testament-filter test pattern on the Bible Books screen
  // (bible/index.tsx): the SegmentedControl narrows `filteredBooks` via
  // Bible.isNewTestament without disturbing the underlying full progress list.
  it("narrows the book list by testament", async () => {
    const allBooks = computeBibleProgress([]).books;
    const oldTestamentCount = allBooks.filter((b) => !Bible.isNewTestament(b.bookIndex)).length;
    const newTestamentCount = allBooks.filter((b) => Bible.isNewTestament(b.bookIndex)).length;

    const { getAllByTestId, getByLabelText } = await renderWithProviders(<Checklist />);
    const BOOK_ROW = /^checklist\.book-/;

    expect(getAllByTestId(BOOK_ROW)).toHaveLength(allBooks.length);

    await fireEvent.press(getByLabelText("OT"));
    let rows = getAllByTestId(BOOK_ROW);
    expect(rows).toHaveLength(oldTestamentCount);
    for (const row of rows) {
      const bookIndex = Number(row.props.testID.replace("checklist.book-", ""));
      expect(Bible.isNewTestament(bookIndex)).toBe(false);
    }

    await fireEvent.press(getByLabelText("NT"));
    rows = getAllByTestId(BOOK_ROW);
    expect(rows).toHaveLength(newTestamentCount);
    for (const row of rows) {
      const bookIndex = Number(row.props.testID.replace("checklist.book-", ""));
      expect(Bible.isNewTestament(bookIndex)).toBe(true);
    }
  });

  it("creates an entry when an unread chapter is pressed", async () => {
    const createEntry = jest.spyOn(logEntryActions, "createEntry").mockResolvedValue(undefined);

    const { getByLabelText } = await renderWithProviders(<Checklist />);

    await fireEvent.press(getByLabelText("Genesis"));
    await fireEvent.press(getByLabelText("Genesis chapter 1, not read"));

    await waitFor(() => {
      expect(createEntry).toHaveBeenCalledWith({
        date: today,
        startVerseId: chapter1Start,
        endVerseId: chapter1End,
      });
    });
  });

  it("deletes the matching entry when a complete chapter with its own entry is pressed", async () => {
    const entry: StoredLogEntry = {
      clientId: "client-1",
      date: today,
      startVerseId: chapter1Start,
      endVerseId: chapter1End,
    };
    useLogEntriesStore.setState({ state: { status: "ready", entries: [entry], isSyncing: false } });
    useBibleProgressStore.setState({
      progress: computeBibleProgress([entry]),
      jobs: 0,
    });
    const deleteEntry = jest.spyOn(logEntryActions, "deleteEntry").mockResolvedValue(undefined);

    const { getByLabelText } = await renderWithProviders(<Checklist />);

    await fireEvent.press(getByLabelText("Genesis"));
    await fireEvent.press(getByLabelText("Genesis chapter 1, read"));

    await waitFor(() => {
      expect(deleteEntry).toHaveBeenCalledWith("client-1");
    });
  });

  it("shows an info toast (without deleting) when a complete chapter is only covered by a wider entry logged today", async () => {
    // Genesis 1-2 logged as one entry: chapter 1 reads complete but has no
    // matching entry of its own to delete.
    const wideEntry: StoredLogEntry = {
      clientId: "client-wide",
      date: today,
      startVerseId: chapter1Start,
      endVerseId: Bible.makeVerseId(GENESIS, 2, Bible.getChapterVerseCount(GENESIS, 2)),
    };
    useLogEntriesStore.setState({
      state: { status: "ready", entries: [wideEntry], isSyncing: false },
    });
    useBibleProgressStore.setState({
      progress: computeBibleProgress([wideEntry]),
      jobs: 0,
    });
    const deleteEntry = jest.spyOn(logEntryActions, "deleteEntry").mockResolvedValue(undefined);

    const { getByLabelText, findByTestId } = await renderWithProviders(<Checklist />);

    await fireEvent.press(getByLabelText("Genesis"));
    await fireEvent.press(getByLabelText("Genesis chapter 1, read"));

    const toast = await findByTestId("toast.message");
    expect(toast.props.children).toBe(
      "This chapter was logged as part of a longer passage, so it can't be unchecked here. You can edit that entry on the Calendar page."
    );
    expect(deleteEntry).not.toHaveBeenCalled();
  });

  it("shows an info toast (without deleting) when a complete chapter is only covered by an earlier entry", async () => {
    const earlierEntry: StoredLogEntry = {
      clientId: "client-earlier",
      date: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
      startVerseId: chapter1Start,
      endVerseId: chapter1End,
    };
    useLogEntriesStore.setState({
      state: { status: "ready", entries: [earlierEntry], isSyncing: false },
    });
    useBibleProgressStore.setState({
      progress: computeBibleProgress([earlierEntry]),
      jobs: 0,
    });
    const deleteEntry = jest.spyOn(logEntryActions, "deleteEntry").mockResolvedValue(undefined);

    const { getByLabelText, findByTestId } = await renderWithProviders(<Checklist />);

    await fireEvent.press(getByLabelText("Genesis"));
    await fireEvent.press(getByLabelText("Genesis chapter 1, read"));

    const toast = await findByTestId("toast.message");
    expect(toast.props.children).toBe(
      "This chapter was logged before today. You can edit previous log entries on the Calendar page."
    );
    expect(deleteEntry).not.toHaveBeenCalled();
  });

  it("shows an error toast when creating an entry fails", async () => {
    jest.spyOn(logEntryActions, "createEntry").mockRejectedValue(new Error("network"));

    const { getByLabelText, findByTestId } = await renderWithProviders(<Checklist />);

    await fireEvent.press(getByLabelText("Genesis"));
    await fireEvent.press(getByLabelText("Genesis chapter 1, not read"));

    const toast = await findByTestId("toast.message");
    expect(toast.props.children).toBe("Unable to mark the chapter complete.");
  });

  it("shows an error toast when deleting an entry fails", async () => {
    const entry: StoredLogEntry = {
      clientId: "client-1",
      date: today,
      startVerseId: chapter1Start,
      endVerseId: chapter1End,
    };
    useLogEntriesStore.setState({ state: { status: "ready", entries: [entry], isSyncing: false } });
    useBibleProgressStore.setState({
      progress: computeBibleProgress([entry]),
      jobs: 0,
    });
    jest.spyOn(logEntryActions, "deleteEntry").mockRejectedValue(new Error("network"));

    const { getByLabelText, findByTestId } = await renderWithProviders(<Checklist />);

    await fireEvent.press(getByLabelText("Genesis"));
    await fireEvent.press(getByLabelText("Genesis chapter 1, read"));

    const toast = await findByTestId("toast.message");
    expect(toast.props.children).toBe("Unable to mark the chapter incomplete.");
  });
});
