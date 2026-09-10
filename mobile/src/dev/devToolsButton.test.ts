import AsyncStorage from "@react-native-async-storage/async-storage";
import { appStorage } from "@/src/storage/keys";
import {
  __resetDevMenuCacheForTest,
  initDevToolsButton,
  isDevToolsButtonToggleSupported,
  loadDevToolsButtonVisible,
  setDevToolsButtonVisible,
} from "./devToolsButton";

const STORAGE_KEY = "devToolsButtonVisible.v1";

// The global mock from `jest.setup.ts`; mutated below to stand in for a build
// whose `expo-dev-menu` predates the toggle.
const devMenu = require("expo-dev-menu") as { setToolsButtonVisible?: jest.Mock };
const setToolsButtonVisible = devMenu.setToolsButtonVisible!;

beforeEach(async () => {
  devMenu.setToolsButtonVisible = setToolsButtonVisible;
  setToolsButtonVisible.mockClear();
  __resetDevMenuCacheForTest();
  appStorage.__resetForTest();
  await AsyncStorage.clear();
});

/** Drop the setter the way an older `expo-dev-menu` would. */
function withoutToggleSupport() {
  delete devMenu.setToolsButtonVisible;
  __resetDevMenuCacheForTest();
}

describe("loadDevToolsButtonVisible", () => {
  it("defaults to visible when nothing is stored", async () => {
    expect(await loadDevToolsButtonVisible()).toBe(true);
  });

  it("reads back a stored preference", async () => {
    await setDevToolsButtonVisible(false);
    expect(await loadDevToolsButtonVisible()).toBe(false);
  });

  it("ignores a non-boolean value", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify("nope"));
    expect(await loadDevToolsButtonVisible()).toBe(true);
  });
});

describe("setDevToolsButtonVisible", () => {
  it("applies the change natively and persists it", async () => {
    expect(await setDevToolsButtonVisible(false)).toBe(true);
    expect(setToolsButtonVisible).toHaveBeenCalledWith(false);
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("reports failure and stores nothing when the dev menu has no toggle", async () => {
    withoutToggleSupport();
    expect(await setDevToolsButtonVisible(false)).toBe(false);
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("initDevToolsButton", () => {
  it("re-applies the stored preference at launch", async () => {
    await setDevToolsButtonVisible(false);
    setToolsButtonVisible.mockClear();

    initDevToolsButton();
    await new Promise((resolve) => setImmediate(resolve));

    expect(setToolsButtonVisible).toHaveBeenCalledWith(false);
  });

  it("does nothing when the dev menu has no toggle", () => {
    withoutToggleSupport();
    expect(isDevToolsButtonToggleSupported()).toBe(false);
    expect(() => initDevToolsButton()).not.toThrow();
  });
});
