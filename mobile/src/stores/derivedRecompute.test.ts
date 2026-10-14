import { useLogEntriesStore } from "@/src/stores/logEntries";
import { useUserSettingsStore } from "@/src/stores/userSettings";
import { subscribeDerivedRecompute } from "./derivedRecompute";

/**
 * `subscribeDerivedRecompute` wiring: an immediate compute on subscribe, then a
 * coalesced recompute (trailing debounce) across bursts of entries/settings
 * writes, driven by two independent trigger conditions.
 */

function setEntriesReady(entries: unknown[]): void {
  useLogEntriesStore.setState({
    state: { status: "ready", entries: entries as never, isSyncing: false },
  });
}

function setSettingsReady(lookBackDate: string): void {
  useUserSettingsStore.setState({
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
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  useLogEntriesStore.setState({ state: { status: "loading" } });
  useUserSettingsStore.setState({ state: { status: "loading" } });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("subscribeDerivedRecompute", () => {
  it("recomputes immediately on subscribe", () => {
    const recompute = jest.fn();
    subscribeDerivedRecompute(recompute);
    expect(recompute).toHaveBeenCalledTimes(1);
  });

  it("coalesces a burst of entries-reference changes into a single trailing recompute", () => {
    const recompute = jest.fn();
    subscribeDerivedRecompute(recompute);
    recompute.mockClear();

    setEntriesReady([{ clientId: "a" }]);
    setEntriesReady([{ clientId: "a" }, { clientId: "b" }]);
    setEntriesReady([{ clientId: "a" }, { clientId: "b" }, { clientId: "c" }]);

    // Not yet — the timer hasn't elapsed.
    expect(recompute).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);

    expect(recompute).toHaveBeenCalledTimes(1);
  });

  it("coalesces a burst of look-back-date changes into a single trailing recompute", () => {
    const recompute = jest.fn();
    subscribeDerivedRecompute(recompute);
    recompute.mockClear();

    setSettingsReady("2026-01-01");
    setSettingsReady("2026-02-01");
    setSettingsReady("2026-03-01");

    expect(recompute).not.toHaveBeenCalled();
    jest.advanceTimersByTime(50);
    expect(recompute).toHaveBeenCalledTimes(1);
  });

  it("restarts the coalesce window on each write, not firing until it goes quiet", () => {
    const recompute = jest.fn();
    subscribeDerivedRecompute(recompute);
    recompute.mockClear();

    setEntriesReady([{ clientId: "a" }]);
    jest.advanceTimersByTime(40);
    expect(recompute).not.toHaveBeenCalled();

    // A second write inside the window pushes the deadline out again.
    setEntriesReady([{ clientId: "a" }, { clientId: "b" }]);
    jest.advanceTimersByTime(40);
    expect(recompute).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    expect(recompute).toHaveBeenCalledTimes(1);
  });

  it("treats entries-change and look-back-date-change as independent triggers", () => {
    const recompute = jest.fn();
    subscribeDerivedRecompute(recompute);
    recompute.mockClear();

    setEntriesReady([{ clientId: "a" }]);
    jest.advanceTimersByTime(50);
    expect(recompute).toHaveBeenCalledTimes(1);

    setSettingsReady("2026-01-01");
    jest.advanceTimersByTime(50);
    expect(recompute).toHaveBeenCalledTimes(2);
  });

  it("does not recompute again when the entries reference is unchanged", () => {
    const recompute = jest.fn();
    subscribeDerivedRecompute(recompute);
    recompute.mockClear();

    const entries = [{ clientId: "a" }];
    setEntriesReady(entries);
    jest.advanceTimersByTime(50);
    expect(recompute).toHaveBeenCalledTimes(1);
    recompute.mockClear();

    // Same array reference, only an unrelated field (isSyncing) changed.
    useLogEntriesStore.setState({
      state: { status: "ready", entries: entries as never, isSyncing: true },
    });
    jest.advanceTimersByTime(50);
    expect(recompute).not.toHaveBeenCalled();
  });
});
