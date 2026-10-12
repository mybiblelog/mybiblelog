// Capture the focus effect so the test can simulate focus/blur transitions.
let mockFocusEffectCallback: (() => void | (() => void)) | null = null;
jest.mock("expo-router", () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    mockFocusEffectCallback = cb;
  },
}));

import { computeBibleProgress } from "@mybiblelog/shared";
import { act, fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useBibleProgressStore } from "@/src/stores/bibleProgress";
import { useLogEntriesStore } from "@/src/stores/logEntries";
import { DEFAULT_BOOK_LIST_PREFS, useBookListPrefsStore } from "@/src/stores/bookListPrefs";
import Checklist from "@/app/(tabs)/checklist";

beforeEach(() => {
  useBookListPrefsStore.setState({ prefs: DEFAULT_BOOK_LIST_PREFS, touched: false });
  mockFocusEffectCallback = null;
  useBibleProgressStore.setState({ progress: computeBibleProgress([]), jobs: 0 });
  useLogEntriesStore.setState({ state: { status: "ready", entries: [], isSyncing: false } });
});

describe("Checklist screen", () => {
  it("collapses expanded books when the screen loses focus", () => {
    const { getByLabelText, queryByLabelText } = renderWithProviders(<Checklist />);

    // Expand Genesis: its chapter cells appear.
    fireEvent.press(getByLabelText("Genesis"));
    expect(getByLabelText("Genesis chapter 1, not read")).toBeTruthy();

    // Simulate focus, then blur (the focus effect's cleanup).
    let cleanup: void | (() => void);
    act(() => {
      cleanup = mockFocusEffectCallback?.();
    });
    act(() => {
      if (typeof cleanup === "function") cleanup();
    });

    expect(queryByLabelText("Genesis chapter 1, not read")).toBeNull();
  });

  it("sort toggle flips between traditional and alphabetical order", () => {
    const { getByTestId, getAllByText } = renderWithProviders(<Checklist />);
    const firstOf = () => getAllByText(/^(Acts|Genesis)$/)[0].props.children;
    const toggle = getByTestId("checklist.sort-toggle");

    expect(firstOf()).toBe("Genesis");
    expect(toggle).toHaveProp("accessibilityLabel", "Book order: Traditional");

    fireEvent.press(toggle);
    expect(firstOf()).toBe("Acts");
    expect(getByTestId("checklist.sort-toggle")).toHaveProp(
      "accessibilityLabel",
      "Book order: Alphabetical"
    );

    fireEvent.press(getByTestId("checklist.sort-toggle"));
    expect(firstOf()).toBe("Genesis");
  });
});
