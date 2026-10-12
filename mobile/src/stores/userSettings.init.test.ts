/**
 * Launch-time settings hydration and the onboarding wizard's server push.
 *
 * Both defend a user's progress against the look-back date (tracker start): an
 * unpersisted default that slides to "today" on every launch, and a wizard push
 * that overwrote an existing account's tracker start on sign-in.
 *
 * `initUserSettings` is module-guarded, so every case runs inside
 * `jest.isolateModulesAsync` with a fresh registry — fresh stores and a fresh
 * AsyncStorage mock. Everything must be required from inside that registry.
 */

import dayjs from "dayjs";

const mockGetSettings = jest.fn();
const mockUpdateSettings = jest.fn();
jest.mock("@/src/api/settingsApi", () => ({
  getSettings: mockGetSettings,
  updateSettings: mockUpdateSettings,
}));

let mockAuthStatus: "authenticated" | "unauthenticated" = "unauthenticated";
let mockAuthListener: (() => void) | null = null;
jest.mock("@/src/stores/auth", () => ({
  useAuthStore: {
    getState: () => ({ state: { status: mockAuthStatus } }),
    subscribe: (listener: () => void) => {
      mockAuthListener = listener;
      return () => {};
    },
  },
}));
jest.mock("@/src/stores/connectivity", () => ({
  getIsOnline: () => true,
  useConnectivityStore: { subscribe: () => () => {} },
}));

const SETTINGS_KEY = "userSettings.v1";
const LOG_ENTRIES_KEY = "logEntries.v1";
const PENDING_PUSH_KEY = "userSettings.pendingServerPush.v2";

type Modules = {
  AsyncStorage: typeof import("@react-native-async-storage/async-storage").default;
  store: typeof import("./userSettings");
};

async function withFreshModules(fn: (m: Modules) => Promise<void>): Promise<void> {
  await jest.isolateModulesAsync(async () => {
    const asyncStorageModule = require("@react-native-async-storage/async-storage");
    const AsyncStorage = asyncStorageModule.default ?? asyncStorageModule;
    const store = require("./userSettings");
    await fn({ AsyncStorage, store });
  });
}

async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve));
}

async function storedSettings(AsyncStorage: Modules["AsyncStorage"]): Promise<unknown> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : null;
}

function readySettings(store: Modules["store"]) {
  const state = store.useUserSettingsStore.getState().state;
  return state.status === "ready" ? state.settings : null;
}

beforeEach(() => {
  mockAuthStatus = "unauthenticated";
  mockAuthListener = null;
  mockGetSettings.mockResolvedValue({});
  mockUpdateSettings.mockImplementation(async (partial: object) => partial);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("hydrating with no stored settings", () => {
  it("anchors the tracker start to the earliest entry and persists it", async () => {
    await withFreshModules(async ({ AsyncStorage, store }) => {
      await AsyncStorage.setItem(
        LOG_ENTRIES_KEY,
        JSON.stringify([
          { clientId: "a", date: "2025-02-01", startVerseId: 101001001, endVerseId: 101001005 },
          { clientId: "b", date: "2024-12-25", startVerseId: 101002001, endVerseId: 101002005 },
        ])
      );

      store.initUserSettings();
      await flush();

      expect(readySettings(store)?.lookBackDate).toBe("2024-12-25");
      expect(await storedSettings(AsyncStorage)).toEqual(
        expect.objectContaining({ lookBackDate: "2024-12-25" })
      );
    });
  });

  it("persists today's date when nothing has been logged, so it stays put", async () => {
    await withFreshModules(async ({ AsyncStorage, store }) => {
      store.initUserSettings();
      await flush();

      expect(await storedSettings(AsyncStorage)).toEqual(
        expect.objectContaining({ lookBackDate: dayjs().format("YYYY-MM-DD") })
      );
    });
  });

  it("persists nothing when the settings key can't be read", async () => {
    await withFreshModules(async ({ AsyncStorage, store }) => {
      const realGetItem = AsyncStorage.getItem.bind(AsyncStorage);
      jest
        .spyOn(AsyncStorage, "getItem")
        .mockImplementation((key: string) =>
          key === SETTINGS_KEY ? Promise.reject(new Error("locked")) : realGetItem(key)
        );
      const setItem = jest.spyOn(AsyncStorage, "setItem");

      store.initUserSettings();
      await flush();

      expect(readySettings(store)).not.toBeNull();
      expect(setItem).not.toHaveBeenCalledWith(SETTINGS_KEY, expect.anything());
    });
  });
});

describe("pushing the wizard's settings on sign-in", () => {
  it("pushes only the staged fields — never the tracker start — then clears them", async () => {
    await withFreshModules(async ({ AsyncStorage, store }) => {
      store.initUserSettings();
      await flush();

      await store.userSettingsActions.setLocalSettingsWithPendingSync({ dailyVerseCountGoal: 40 });
      await store.userSettingsActions.setLocalSettingsWithPendingSync({
        preferredBibleVersion: "NIV",
        preferredBibleApp: "youversion",
      });
      expect(JSON.parse((await AsyncStorage.getItem(PENDING_PUSH_KEY))!)).toEqual([
        "dailyVerseCountGoal",
        "preferredBibleVersion",
      ]);

      mockAuthStatus = "authenticated";
      mockAuthListener?.();
      await flush();

      expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        dailyVerseCountGoal: 40,
        preferredBibleVersion: "NIV",
      });
      expect(mockGetSettings).not.toHaveBeenCalled();
      expect(await AsyncStorage.getItem(PENDING_PUSH_KEY)).toBeNull();
    });
  });

  it("pulls server settings when nothing was staged", async () => {
    await withFreshModules(async ({ store }) => {
      store.initUserSettings();
      await flush();

      mockAuthStatus = "authenticated";
      mockAuthListener?.();
      await flush();

      expect(mockUpdateSettings).not.toHaveBeenCalled();
      expect(mockGetSettings).toHaveBeenCalled();
    });
  });
});
