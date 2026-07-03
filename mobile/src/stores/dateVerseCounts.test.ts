const mockComputeDateVerseCounts = jest.fn();
jest.mock("@mybiblelog/shared", () => ({
  ...jest.requireActual("@mybiblelog/shared"),
  computeDateVerseCounts: (...args: unknown[]) => mockComputeDateVerseCounts(...args),
}));
jest.mock("@/src/storage/dateVerseCountsCache", () => ({
  getCache: jest.fn(async () => null),
  setCache: jest.fn(async () => {}),
}));

import { getCache, setCache } from "@/src/storage/dateVerseCountsCache";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import { useLogEntriesStore } from "./logEntries";
import { useUserSettingsStore } from "./userSettings";
import { useDateVerseCountsStore } from "./dateVerseCounts";

function setEntries(entries: StoredLogEntry[]) {
  useLogEntriesStore.setState({ state: { status: "ready", entries, isSyncing: false } });
}
function setLookBack(lookBackDate: string) {
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
}

beforeEach(() => {
  mockComputeDateVerseCounts.mockReset();
  (getCache as jest.Mock).mockResolvedValue(null);
  (setCache as jest.Mock).mockClear();
  useDateVerseCountsStore.setState({ jobs: 0, dateVerseCounts: {} });
});

describe("cacheDateVerseCounts", () => {
  it("computes from the earliest entry through today using the look-back date", async () => {
    mockComputeDateVerseCounts.mockReturnValue({ "2026-06-27": { total: 5, unique: 5 } });
    setEntries([
      { clientId: "a", date: "2026-06-27", startVerseId: 1, endVerseId: 2 },
      { clientId: "b", date: "2026-06-20", startVerseId: 3, endVerseId: 4 },
    ]);
    setLookBack("2020-01-01");

    await useDateVerseCountsStore.getState().cacheDateVerseCounts();

    expect(mockComputeDateVerseCounts).toHaveBeenCalledWith(
      expect.any(Array),
      "2026-06-20", // earliest entry date
      expect.any(String), // today
      "2020-01-01" // tracker start (lookBackDate)
    );
    expect(useDateVerseCountsStore.getState().dateVerseCounts).toMatchObject({
      "2026-06-27": { total: 5, unique: 5 },
    });
    expect(setCache).toHaveBeenCalled();
  });

  it("does nothing when there are no entries", async () => {
    setEntries([]);
    setLookBack("2020-01-01");
    await useDateVerseCountsStore.getState().cacheDateVerseCounts();
    expect(mockComputeDateVerseCounts).not.toHaveBeenCalled();
  });

  it("replaces cache-hydrated values with the computed map (no stale merge)", async () => {
    // A date present in the old cache but absent from the fresh computation
    // (e.g. its entries were deleted) must not survive the recompute.
    (getCache as jest.Mock).mockResolvedValue({ "2026-01-01": { total: 1, unique: 1 } });
    mockComputeDateVerseCounts.mockReturnValue({ "2026-06-27": { total: 2, unique: 2 } });
    setEntries([{ clientId: "a", date: "2026-06-27", startVerseId: 1, endVerseId: 2 }]);
    setLookBack("2020-01-01");
    await useDateVerseCountsStore.getState().cacheDateVerseCounts();
    expect(useDateVerseCountsStore.getState().dateVerseCounts).toEqual({
      "2026-06-27": { total: 2, unique: 2 },
    });
  });
});
