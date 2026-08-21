import { Bible, computeBibleProgress } from "@mybiblelog/shared";
import { useAuthStore } from "@/src/stores/auth";
import { useBibleProgressStore } from "@/src/stores/bibleProgress";
import { useLogEntriesStore } from "@/src/stores/logEntries";
import { useUserSettingsStore } from "@/src/stores/userSettings";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test-utils/renderWithProviders";
import { ReadingTrackerResetCard } from "./ReadingTrackerResetCard";

const updateServerSettings = jest.fn();
const setLocalSettings = jest.fn();

/** One entry per book, together covering the whole Bible (book indices are 1-based). */
const wholeBibleEntries = Array.from({ length: Bible.getBookCount() }, (_, i) => ({
  clientId: `book-${i + 1}`,
  date: "2026-01-02",
  startVerseId: Bible.getFirstBookVerseId(i + 1),
  endVerseId: Bible.getLastBookVerseId(i + 1),
  updatedAt: "2026-01-02T00:00:00.000Z",
}));

function seed({
  entries = wholeBibleEntries,
  dismissed = false,
  lookBackDate = "2026-01-01",
} = {}) {
  useLogEntriesStore.setState({
    state: { status: "ready", entries, isSyncing: false },
  });
  // The card reads completion off the precomputed progress snapshot, which is
  // scoped to the tracker window — mirror that filtering here.
  useBibleProgressStore.setState({
    progress: computeBibleProgress(entries.filter((e) => e.date >= lookBackDate)),
    jobs: 0,
  });
  useUserSettingsStore.setState({
    readingTrackerResetDelayed: dismissed,
    state: {
      status: "ready",
      settings: {
        lookBackDate,
        dailyVerseCountGoal: 86,
        preferredBibleVersion: "kjv",
        preferredBibleApp: "",
      },
      isRefreshingFromServer: false,
    },
    updateServerSettings,
    setLocalSettings,
  });
}

beforeEach(() => {
  updateServerSettings.mockResolvedValue(true);
  setLocalSettings.mockResolvedValue(undefined);
  useAuthStore.setState({ state: { status: "authenticated", user: { id: "u1" } } } as never);
  seed();
});

describe("ReadingTrackerResetCard", () => {
  it("offers to start fresh once the Bible is complete and nothing is logged today", () => {
    renderWithProviders(<ReadingTrackerResetCard hasEntriesToday={false} />);
    expect(screen.getByText("You've read the whole Bible!")).toBeTruthy();
    expect(screen.getByText("Start Fresh")).toBeTruthy();
  });

  it("stays hidden while the Bible is incomplete", () => {
    seed({ entries: [] });
    renderWithProviders(<ReadingTrackerResetCard hasEntriesToday={false} />);
    expect(screen.queryByText("Start Fresh")).toBeNull();
  });

  it("stays hidden when the whole Bible was read before the tracker start date", () => {
    // Entries predate the tracker reset, so this pass still has unread portions.
    seed({ lookBackDate: "2026-06-01" });
    renderWithProviders(<ReadingTrackerResetCard hasEntriesToday={false} />);
    expect(screen.queryByText("Start Fresh")).toBeNull();
  });

  it("stays hidden once something is logged today", () => {
    // Reading resumed — "start over" is no longer the obvious next step.
    renderWithProviders(<ReadingTrackerResetCard hasEntriesToday />);
    expect(screen.queryByText("Start Fresh")).toBeNull();
  });

  it("stays hidden after being dismissed", () => {
    seed({ dismissed: true });
    renderWithProviders(<ReadingTrackerResetCard hasEntriesToday={false} />);
    expect(screen.queryByText("Start Fresh")).toBeNull();
  });

  it("dismissing sets the transient flag rather than persisting it", () => {
    renderWithProviders(<ReadingTrackerResetCard hasEntriesToday={false} />);
    fireEvent.press(screen.getByText("Dismiss"));
    expect(useUserSettingsStore.getState().readingTrackerResetDelayed).toBe(true);
  });

  it("moves the tracker start date to today on the server", async () => {
    renderWithProviders(<ReadingTrackerResetCard hasEntriesToday={false} />);
    fireEvent.press(screen.getByText("Start Fresh"));
    await waitFor(() => expect(updateServerSettings).toHaveBeenCalled());
    expect(updateServerSettings.mock.calls[0][0]).toEqual({
      lookBackDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(setLocalSettings).not.toHaveBeenCalled();
  });

  it("falls back to local settings when the server save fails", async () => {
    updateServerSettings.mockResolvedValue(false);
    renderWithProviders(<ReadingTrackerResetCard hasEntriesToday={false} />);
    fireEvent.press(screen.getByText("Start Fresh"));
    await waitFor(() => expect(setLocalSettings).toHaveBeenCalled());
    expect(setLocalSettings.mock.calls[0][0]).toEqual({
      lookBackDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
  });

  it("saves locally without attempting the server when signed out", async () => {
    useAuthStore.setState({ state: { status: "unauthenticated" } } as never);
    renderWithProviders(<ReadingTrackerResetCard hasEntriesToday={false} />);
    fireEvent.press(screen.getByText("Start Fresh"));
    await waitFor(() => expect(setLocalSettings).toHaveBeenCalled());
    expect(updateServerSettings).not.toHaveBeenCalled();
  });
});
