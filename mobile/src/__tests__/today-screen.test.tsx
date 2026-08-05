jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useFocusEffect: jest.fn(),
}));
jest.mock("@/src/api/notesApi", () => ({
  ...jest.requireActual("@/src/api/notesApi"),
  fetchNotesPage: jest.fn().mockResolvedValue({
    notes: [],
    meta: { offset: 0, limit: 10, size: 0 },
  }),
}));

import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { router } from "expo-router";
import Today from "@/app/(tabs)/index";
import { useAuthStore } from "@/src/stores/auth";
import { useDateVerseCountsStore } from "@/src/stores/dateVerseCounts";
import { useLogEntriesStore } from "@/src/stores/logEntries";
import { initialNotesQuery, useNotesStore } from "@/src/stores/passageNotes";
import { useUserSettingsStore } from "@/src/stores/userSettings";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

// Local date, matching the screen's `dayjs().format(...)`. `toISOString()` is
// UTC, so west of Greenwich it names tomorrow for part of every evening and the
// seeded entries stop being "today".
const TODAY = dayjs().format("YYYY-MM-DD");
const GOAL = 50;

/** Genesis 1:1–1:10 — ten verses, all inside one chapter. */
const GEN_1_1 = Bible.makeVerseId(1, 1, 1);
const GEN_1_10 = Bible.makeVerseId(1, 1, 10);

const entry = (over: Partial<Record<string, unknown>> = {}) => ({
  clientId: "e1",
  date: TODAY,
  startVerseId: GEN_1_1,
  endVerseId: GEN_1_10,
  updatedAt: `${TODAY}T08:00:00.000Z`,
  ...over,
});

function seed({
  entries = [entry()],
  goal = GOAL,
  uniqueToday,
  loadingEntries = false,
  loadingSettings = false,
}: {
  entries?: ReturnType<typeof entry>[];
  goal?: number;
  uniqueToday?: number;
  loadingEntries?: boolean;
  loadingSettings?: boolean;
} = {}) {
  useLogEntriesStore.setState({
    state: loadingEntries ? { status: "loading" } : { status: "ready", entries, isSyncing: false },
  });
  useUserSettingsStore.setState({
    readingTrackerResetDelayed: false,
    state: loadingSettings
      ? { status: "loading" }
      : {
          status: "ready",
          settings: {
            lookBackDate: "2026-01-01",
            dailyVerseCountGoal: goal,
            preferredBibleVersion: "kjv",
            preferredBibleApp: "",
          },
          isRefreshingFromServer: false,
        },
  });
  useDateVerseCountsStore.setState({
    jobs: 0,
    dateVerseCounts:
      uniqueToday === undefined ? {} : { [TODAY]: { total: uniqueToday, unique: uniqueToday } },
  });
}

beforeEach(() => {
  (router.push as jest.Mock).mockClear();
  useAuthStore.setState({ state: { status: "authenticated", user: { id: "u1" } } } as never);
  useNotesStore.setState({ state: { status: "idle" }, query: { ...initialNotesQuery } });
  seed({ uniqueToday: 0 });
});

describe("Today screen", () => {
  it("renders the title and the add-entry control", () => {
    renderWithProviders(<Today />);
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByTestId("today.add-entry")).toBeTruthy();
  });

  describe("daily goal", () => {
    it("measures the goal in new verses, not total verses read", () => {
      // 10 verses read today, but only 4 of them were new. Web's primary bar
      // tracks the new count — this is the number the two platforms must agree
      // on, and the reason mobile can't just use countUniqueRangeVerses.
      seed({ uniqueToday: 4 });
      renderWithProviders(<Today />);

      const bar = screen.getByTestId("double-progress-bar");
      expect(bar.props.accessibilityValue.now).toBe(Math.round((4 / GOAL) * 100));
      expect(screen.getByText("8%")).toBeTruthy();
      expect(screen.getByTestId("daily-goal-summary").props.children).toContain(
        `4 / ${GOAL} new verses`
      );
    });

    it("shows total verses read behind the new-verse count", () => {
      seed({ uniqueToday: 4 });
      renderWithProviders(<Today />);
      // Both fills render; the secondary one carries the dimming.
      expect(screen.getByTestId("primary-bar")).toBeTruthy();
      expect(screen.getByTestId("secondary-bar")).toBeTruthy();
    });

    it("celebrates only once the goal is actually met", () => {
      seed({ uniqueToday: GOAL - 1 });
      renderWithProviders(<Today />);
      expect(screen.queryByTestId("primary-bar-complete")).toBeNull();

      screen.rerender(<Today />);
      seed({ uniqueToday: GOAL });
      screen.rerender(<Today />);
      expect(screen.getByTestId("primary-bar-complete")).toBeTruthy();
    });

    it("points at Settings when no goal is set", () => {
      seed({ goal: 0, uniqueToday: 3 });
      renderWithProviders(<Today />);
      expect(screen.getByTestId("daily-goal-summary").props.children).toContain(
        "Set a daily goal in Settings"
      );
    });
  });

  describe("entry rows", () => {
    it("reports the passage and how much of it was new", () => {
      renderWithProviders(<Today />);
      expect(screen.getByText(Bible.displayVerseRange(GEN_1_1, GEN_1_10))).toBeTruthy();
      // Nothing read before today, so all ten verses are new.
      expect(screen.getByText("10 verses - all new")).toBeTruthy();
    });

    it('says "all new" rather than repeating the number', () => {
      renderWithProviders(<Today />);
      expect(screen.queryByText("10 verses - 10 new")).toBeNull();
    });

    it("counts only the unread part when a passage overlaps earlier reading", () => {
      // Genesis 1:1-5 read last week, then 1:1-10 today: 5 of 10 are new.
      seed({
        entries: [
          entry({
            clientId: "old",
            date: "2026-02-01",
            endVerseId: Bible.makeVerseId(1, 1, 5),
          }),
          entry({ clientId: "new" }),
        ],
      });
      renderWithProviders(<Today />);
      expect(screen.getByText("10 verses - 5 new")).toBeTruthy();
    });
  });

  describe("loading", () => {
    it("shows placeholder rows rather than a blank screen", () => {
      seed({ loadingEntries: true });
      renderWithProviders(<Today />);
      // The layout renders immediately; only the list is standing in.
      expect(screen.getByText("Today")).toBeTruthy();
      expect(screen.getAllByLabelText("Loading...").length).toBeGreaterThan(0);
    });

    it("holds the goal at zero until the counts land, rather than jumping", () => {
      // jobs in flight, counts map still empty — the cold-start gap.
      useDateVerseCountsStore.setState({ jobs: 1, dateVerseCounts: {} });
      renderWithProviders(<Today />);
      expect(screen.getByTestId("double-progress-bar").props.accessibilityValue.now).toBe(0);
      expect(screen.queryByText("0%")).toBeNull();
    });
  });

  it("offers a way to log the first entry when the day is empty", () => {
    seed({ entries: [] });
    renderWithProviders(<Today />);
    expect(screen.getByText("No entries yet")).toBeTruthy();
  });

  it("sends View All Reading to the calendar", () => {
    renderWithProviders(<Today />);
    fireEvent.press(screen.getByTestId("today.view-all-reading"));
    expect(router.push).toHaveBeenCalledWith("/(tabs)/calendar");
  });

  it("filters the notes tab to a passage from the row menu", () => {
    renderWithProviders(<Today />);
    // The row's kebab is labelled with the passage range.
    fireEvent.press(screen.getByLabelText(Bible.displayVerseRange(GEN_1_1, GEN_1_10)));

    fireEvent.press(screen.getByText("View Notes"));

    const query = useNotesStore.getState().query;
    expect(query.filterPassageStartVerseId).toBe(GEN_1_1);
    expect(query.filterPassageEndVerseId).toBe(GEN_1_10);
    expect(query.filterPassageMatching).toBe("inclusive");
    expect(router.push).toHaveBeenCalledWith("/(tabs)/notes");
  });
});
