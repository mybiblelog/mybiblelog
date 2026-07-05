jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  // No navigation container in tests: run the focus effect as a plain effect.
  useFocusEffect: (cb: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(cb, [cb]);
  },
}));
jest.mock("@/src/storage/dateVerseCountsCache", () => ({
  getCache: jest.fn(async () => null),
  setCache: jest.fn(async () => {}),
}));

import { Bible, computeBibleProgress } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { router } from "expo-router";
import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useBibleProgressStore } from "@/src/stores/bibleProgress";
import { useDateVerseCountsStore } from "@/src/stores/dateVerseCounts";
import { useLogEntriesStore } from "@/src/stores/logEntries";
import { useUserSettingsStore } from "@/src/stores/userSettings";
import Progress from "@/app/(tabs)/bible/progress";

const today = dayjs().format("YYYY-MM-DD");
const lookBackDate = dayjs().subtract(30, "day").format("YYYY-MM-DD");

beforeEach(() => {
  (router.push as jest.Mock).mockClear();
  useLogEntriesStore.setState({
    state: {
      status: "ready",
      entries: [
        {
          clientId: "c1",
          date: today,
          startVerseId: Bible.makeVerseId(1, 1, 1),
          endVerseId: Bible.makeVerseId(1, 1, 31),
        },
      ],
      isSyncing: false,
    },
  });
  useUserSettingsStore.setState({
    state: {
      status: "ready",
      settings: {
        lookBackDate,
        dailyVerseCountGoal: 86,
        preferredBibleVersion: "ESV",
        preferredBibleApp: "",
      },
      isRefreshingFromServer: false,
    },
  });
  useBibleProgressStore.setState({
    progress: computeBibleProgress([
      { startVerseId: Bible.makeVerseId(1, 1, 1), endVerseId: Bible.makeVerseId(1, 1, 31) },
    ]),
    jobs: 0,
  });
  useDateVerseCountsStore.setState({ dateVerseCounts: {}, jobs: 0 });
});

describe("Progress screen", () => {
  it("renders every section", async () => {
    const { getByText } = renderWithProviders(<Progress />);

    await waitFor(() => expect(getByText("Your Reading Settings")).toBeTruthy());
    expect(getByText("Your Progress So Far")).toBeTruthy();
    expect(getByText("Your Historical Outlook")).toBeTruthy();
    expect(getByText("Your 30-Day Outlook")).toBeTruthy();
    expect(getByText("Your 7-Day Outlook")).toBeTruthy();
    expect(getByText("Today's Outlook")).toBeTruthy();
    expect(getByText("Set a Goal")).toBeTruthy();
  });

  it("shows the reading settings values", async () => {
    const { getByText } = renderWithProviders(<Progress />);
    await waitFor(() => expect(getByText("86")).toBeTruthy());
  });

  it("shows verses read and total from the progress store", async () => {
    const total = Bible.getTotalVerseCount();
    const { getAllByText, getByText } = renderWithProviders(<Progress />);
    // "31" appears as Verses Read and as today's new-verse count.
    await waitFor(() => expect(getAllByText("31").length).toBeGreaterThanOrEqual(1));
    expect(getByText(total.toLocaleString("en"))).toBeTruthy();
    // Remaining count also matches the historical days-to-finish projection
    // (31 read over 30 days floors to 1 verse/day).
    expect(getAllByText((total - 31).toLocaleString("en")).length).toBeGreaterThanOrEqual(1);
  });

  it("projects Never at a zero reading rate", async () => {
    useLogEntriesStore.setState({ state: { status: "ready", entries: [], isSyncing: false } });
    useBibleProgressStore.setState({ progress: computeBibleProgress([]), jobs: 0 });
    const { getAllByText } = renderWithProviders(<Progress />);
    // Historical, 30-day, 7-day, and today outlooks all show Never twice
    // (days + date rows).
    await waitFor(() => expect(getAllByText("Never").length).toBe(8));
  });

  it("navigates to reading settings from Update Settings", async () => {
    const { getByText } = renderWithProviders(<Progress />);
    await waitFor(() => expect(getByText("Update Settings")).toBeTruthy());

    fireEvent.press(getByText("Update Settings"));

    expect(router.push).toHaveBeenCalledWith("/(tabs)/settings/reading");
  });

  it("shows placeholders until a goal date is chosen", async () => {
    const { getAllByText, getByText } = renderWithProviders(<Progress />);
    await waitFor(() => expect(getByText("Choose a date")).toBeTruthy());
    expect(getAllByText("?")).toHaveLength(2);
  });
});
