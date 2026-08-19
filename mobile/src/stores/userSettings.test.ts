const DEFAULTS = {
  lookBackDate: "2020-01-01",
  dailyVerseCountGoal: 86,
  preferredBibleVersion: "ESV",
  preferredBibleApp: "",
};

jest.mock("@/src/settings/userSettingsStorage", () => ({
  DEFAULT_LOCAL_USER_SETTINGS: DEFAULTS,
  loadLocalUserSettings: jest.fn(),
  readLocalUserSettings: jest.fn(),
  saveLocalUserSettings: jest.fn(),
}));
jest.mock("@/src/api/settingsApi", () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));
jest.mock("@/src/stores/auth", () => ({
  getAuthToken: jest.fn(() => "tok"),
  useAuthStore: {
    getState: jest.fn(() => ({ state: { status: "authenticated" } })),
    subscribe: jest.fn(),
  },
}));
jest.mock("@/src/stores/connectivity", () => ({
  getIsOnline: jest.fn(() => true),
  useConnectivityStore: { subscribe: jest.fn() },
}));

import {
  loadLocalUserSettings,
  readLocalUserSettings,
  saveLocalUserSettings,
} from "@/src/settings/userSettingsStorage";
import { appStorage } from "@/src/storage/keys";
import {
  __resetForTest as resetStorageHealth,
  recoverStorage,
  reportStorageFailure,
} from "@/src/storage/health";
import { getSettings, updateSettings } from "@/src/api/settingsApi";
import { getIsOnline } from "@/src/stores/connectivity";
import { initUserSettings, useUserSettingsStore } from "./userSettings";

const actions = () => useUserSettingsStore.getState();

function setReady(settings = DEFAULTS) {
  useUserSettingsStore.setState({
    state: { status: "ready", settings, isRefreshingFromServer: false },
  });
}

beforeEach(() => {
  (getIsOnline as jest.Mock).mockReturnValue(true);
  (saveLocalUserSettings as jest.Mock).mockResolvedValue(true);
  setReady();
});

describe("setLocalSettings", () => {
  it("merges and persists the partial update", async () => {
    await actions().setLocalSettings({ preferredBibleApp: "youversion" });
    const state = useUserSettingsStore.getState().state;
    expect(state.status === "ready" && state.settings.preferredBibleApp).toBe("youversion");
    expect(saveLocalUserSettings).toHaveBeenCalledWith(
      expect.objectContaining({ preferredBibleApp: "youversion" })
    );
  });
});

describe("refreshFromServer", () => {
  it("applies server truth and persists when values differ", async () => {
    (getSettings as jest.Mock).mockResolvedValue({ dailyVerseCountGoal: 100 });
    await actions().refreshFromServer();
    const state = useUserSettingsStore.getState().state;
    expect(state.status === "ready" && state.settings.dailyVerseCountGoal).toBe(100);
    expect(saveLocalUserSettings).toHaveBeenCalled();
  });

  it("does not persist when server values match local settings", async () => {
    (getSettings as jest.Mock).mockResolvedValue({ dailyVerseCountGoal: 86 });
    await actions().refreshFromServer();
    expect(saveLocalUserSettings).not.toHaveBeenCalled();
  });

  it("is a no-op when offline", async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    await actions().refreshFromServer();
    expect(getSettings).not.toHaveBeenCalled();
  });
});

describe("updateServerSettings", () => {
  it("returns true and applies the server response on success", async () => {
    (updateSettings as jest.Mock).mockResolvedValue({ dailyVerseCountGoal: 42 });
    const ok = await actions().updateServerSettings({ dailyVerseCountGoal: 42 });
    expect(ok).toBe(true);
    const state = useUserSettingsStore.getState().state;
    expect(state.status === "ready" && state.settings.dailyVerseCountGoal).toBe(42);
  });

  it("returns false when offline without calling the API", async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    const ok = await actions().updateServerSettings({ dailyVerseCountGoal: 42 });
    expect(ok).toBe(false);
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it("returns false when the API call throws", async () => {
    (updateSettings as jest.Mock).mockRejectedValue(new Error("500"));
    const ok = await actions().updateServerSettings({ dailyVerseCountGoal: 42 });
    expect(ok).toBe(false);
  });
});

/**
 * Driven through the real `storage/health` registry rather than by reaching for
 * the rehydrator directly, so the wiring `initUserSettings` sets up is part of
 * what's under test.
 */
describe("rehydrating after a failed read", () => {
  const KEY = appStorage.keyName("userSettings");
  const STORED = {
    lookBackDate: "2019-05-05",
    dailyVerseCountGoal: 120,
    preferredBibleVersion: "NIV",
    preferredBibleApp: "youversion",
  };

  beforeAll(() => {
    // `initUserSettings` is module-guarded, so this registers the rehydrator
    // once for the whole describe.
    (loadLocalUserSettings as jest.Mock).mockResolvedValue(DEFAULTS);
    (getSettings as jest.Mock).mockRejectedValue(new Error("offline"));
    initUserSettings();
  });

  beforeEach(() => {
    jest.useFakeTimers();
    setReady();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    resetStorageHealth();
  });

  async function recoverWithDisk(disk: unknown) {
    (readLocalUserSettings as jest.Mock).mockResolvedValue(disk);
    reportStorageFailure(KEY, "read");
    await recoverStorage();
    const state = useUserSettingsStore.getState().state;
    return state.status === "ready" ? state.settings : null;
  }

  // The whole point of the field-level merge: the hydration defaults the failed
  // read produced must never be promoted into durable truth.
  it("restores stored values the failed read had replaced with defaults", async () => {
    const settings = await recoverWithDisk({ status: "ok", value: STORED });
    expect(settings).toEqual(STORED);
    expect(saveLocalUserSettings).toHaveBeenCalledWith(STORED);
  });

  it("keeps a field the user chose during the outage", async () => {
    (saveLocalUserSettings as jest.Mock).mockResolvedValue(false); // refused
    await actions().setLocalSettings({ dailyVerseCountGoal: 200 });
    (saveLocalUserSettings as jest.Mock).mockResolvedValue(true);

    const settings = await recoverWithDisk({ status: "ok", value: STORED });
    expect(settings).toEqual({ ...STORED, dailyVerseCountGoal: 200 });
  });

  // Choosing the value that happens to match the hydration default is still a
  // choice, so it is keyed on intent rather than on a value diff.
  it("keeps a chosen field even when it matches the hydration default", async () => {
    (saveLocalUserSettings as jest.Mock).mockResolvedValue(false);
    await actions().setLocalSettings({ dailyVerseCountGoal: DEFAULTS.dailyVerseCountGoal });
    (saveLocalUserSettings as jest.Mock).mockResolvedValue(true);

    const settings = await recoverWithDisk({ status: "ok", value: STORED });
    expect(settings?.dailyVerseCountGoal).toBe(DEFAULTS.dailyVerseCountGoal);
  });

  // Once a write lands, the field is on disk and no longer overrides it — or a
  // later outage would take everything ever written wholesale.
  it("stops overriding a field once its write succeeds", async () => {
    await actions().setLocalSettings({ dailyVerseCountGoal: 200 });

    const settings = await recoverWithDisk({ status: "ok", value: STORED });
    expect(settings).toEqual(STORED);
  });

  it("leaves memory alone while the backend is still refusing", async () => {
    const settings = await recoverWithDisk({ status: "unreadable" });
    expect(settings).toEqual(DEFAULTS);
    expect(saveLocalUserSettings).not.toHaveBeenCalled();
  });

  // Nothing worth merging, but re-persisting is what gets the key writing again.
  it("re-persists memory when nothing is stored", async () => {
    const settings = await recoverWithDisk({ status: "absent" });
    expect(settings).toEqual(DEFAULTS);
    expect(saveLocalUserSettings).toHaveBeenCalledWith(DEFAULTS);
  });
});
