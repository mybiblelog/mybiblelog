import { AppState } from "react-native";
import {
  __resetForTest,
  initStorageHealth,
  isStorageDegraded,
  recoverStorage,
  registerManagedKey,
  reportStorageFailure,
  reportStorageOk,
  useStorageHealthStore,
} from "./health";

const KEY = "logEntries.v1";
const OTHER = "passageNotes.local.v1";

beforeEach(() => {
  __resetForTest();
});

afterEach(() => {
  __resetForTest();
  jest.useRealTimers();
});

function degradedKeys(): readonly string[] {
  return useStorageHealthStore.getState().degradedKeys;
}

describe("degraded state", () => {
  it("reports a managed key that failed", () => {
    registerManagedKey(KEY);
    reportStorageFailure(KEY, "read");
    expect(isStorageDegraded()).toBe(true);
    expect(degradedKeys()).toEqual([KEY]);
  });

  // A key whose every write is an authoritative `set` loses the user nothing
  // when its read fails, so it must not claim their changes aren't saving.
  it("ignores a key no store registered", () => {
    reportStorageFailure("themeMode.v1", "read");
    expect(isStorageDegraded()).toBe(false);
    expect(degradedKeys()).toEqual([]);
  });

  // Stores register during init, which can land after the first failed read.
  it("surfaces a failure recorded before the store registered", () => {
    reportStorageFailure(KEY, "read");
    expect(isStorageDegraded()).toBe(false);
    registerManagedKey(KEY);
    expect(isStorageDegraded()).toBe(true);
  });

  // Quarantine only covers reads, but a write that never landed is exactly the
  // thing the banner exists to say.
  it("counts a write failure even though it never quarantines", () => {
    registerManagedKey(KEY);
    reportStorageFailure(KEY, "write");
    expect(isStorageDegraded()).toBe(true);
  });

  it("clears when the backend answers again", () => {
    registerManagedKey(KEY);
    reportStorageFailure(KEY, "read");
    reportStorageOk(KEY);
    expect(isStorageDegraded()).toBe(false);
  });

  it("stays degraded while any other key is still failing", () => {
    registerManagedKey(KEY);
    registerManagedKey(OTHER);
    reportStorageFailure(KEY, "read");
    reportStorageFailure(OTHER, "read");
    reportStorageOk(KEY);
    expect(degradedKeys()).toEqual([OTHER]);
  });

  // Four modules subscribe to this store; re-reporting the same outage must not
  // wake them.
  it("keeps the same array reference when nothing changed", () => {
    registerManagedKey(KEY);
    reportStorageFailure(KEY, "read");
    const first = degradedKeys();
    reportStorageFailure(KEY, "read");
    reportStorageOk(OTHER);
    expect(degradedKeys()).toBe(first);
  });
});

describe("recoverStorage", () => {
  it("runs the rehydrator for each degraded key", async () => {
    const rehydrate = jest.fn().mockResolvedValue(undefined);
    registerManagedKey(KEY, rehydrate);
    reportStorageFailure(KEY, "read");

    await recoverStorage();
    expect(rehydrate).toHaveBeenCalledTimes(1);
  });

  it("leaves healthy keys alone", async () => {
    const rehydrate = jest.fn().mockResolvedValue(undefined);
    registerManagedKey(KEY, rehydrate);

    await recoverStorage();
    expect(rehydrate).not.toHaveBeenCalled();
  });

  // The mutation queues re-read from disk on every mutation, so they register
  // for the banner alone.
  it("tolerates a managed key with no rehydrator", async () => {
    registerManagedKey(KEY);
    reportStorageFailure(KEY, "read");
    await expect(recoverStorage()).resolves.toBeUndefined();
  });

  it("does not strand the other keys when one rehydrator throws", async () => {
    const ok = jest.fn().mockResolvedValue(undefined);
    registerManagedKey(KEY, jest.fn().mockRejectedValue(new Error("still broken")));
    registerManagedKey(OTHER, ok);
    reportStorageFailure(KEY, "read");
    reportStorageFailure(OTHER, "read");

    await recoverStorage();
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it("de-dupes concurrent runs", async () => {
    const rehydrate = jest.fn().mockResolvedValue(undefined);
    registerManagedKey(KEY, rehydrate);
    reportStorageFailure(KEY, "read");

    await Promise.all([recoverStorage(), recoverStorage()]);
    expect(rehydrate).toHaveBeenCalledTimes(1);
  });
});

describe("retry ladder", () => {
  // The usual cause is an app that started before the device was unlocked, which
  // clears within a second or two — this is what saves the session without
  // making any init call site wait.
  it("retries a degraded key on a short ladder", async () => {
    jest.useFakeTimers();
    const rehydrate = jest.fn().mockResolvedValue(undefined);
    registerManagedKey(KEY, rehydrate);
    reportStorageFailure(KEY, "read");

    expect(rehydrate).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(250);
    expect(rehydrate).toHaveBeenCalledTimes(1);

    // Still failing, so the ladder keeps climbing.
    await jest.advanceTimersByTimeAsync(1_000);
    expect(rehydrate).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(3_000);
    expect(rehydrate).toHaveBeenCalledTimes(3);

    // ...and then gives up, leaving the foreground listener as the open trigger.
    await jest.advanceTimersByTimeAsync(60_000);
    expect(rehydrate).toHaveBeenCalledTimes(3);
  });

  it("stops climbing once the key recovers", async () => {
    jest.useFakeTimers();
    const rehydrate = jest.fn().mockImplementation(async () => reportStorageOk(KEY));
    registerManagedKey(KEY, rehydrate);
    reportStorageFailure(KEY, "read");

    await jest.advanceTimersByTimeAsync(250);
    expect(rehydrate).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(rehydrate).toHaveBeenCalledTimes(1);
  });
});

describe("initStorageHealth", () => {
  // Returning to the foreground is the signal the device was unlocked, which is
  // when a refusing backend typically starts working again.
  it("recovers when the app is foregrounded", async () => {
    const listener = jest.fn();
    jest.spyOn(AppState, "addEventListener").mockImplementation(((_: string, cb: never) => {
      listener.mockImplementation(cb);
      return { remove: jest.fn() };
    }) as never);

    initStorageHealth();
    const rehydrate = jest.fn().mockResolvedValue(undefined);
    registerManagedKey(KEY, rehydrate);
    reportStorageFailure(KEY, "read");

    listener("active");
    await Promise.resolve();
    expect(rehydrate).toHaveBeenCalled();
  });

  it("does nothing on foreground while storage is healthy", async () => {
    const listener = jest.fn();
    jest.spyOn(AppState, "addEventListener").mockImplementation(((_: string, cb: never) => {
      listener.mockImplementation(cb);
      return { remove: jest.fn() };
    }) as never);

    initStorageHealth();
    const rehydrate = jest.fn().mockResolvedValue(undefined);
    registerManagedKey(KEY, rehydrate);

    listener("active");
    await Promise.resolve();
    expect(rehydrate).not.toHaveBeenCalled();
  });
});
