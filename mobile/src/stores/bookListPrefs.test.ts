/**
 * `initBookListPrefs` is guarded by a module-level `initialized` flag, so each
 * hydration case runs inside `jest.isolateModulesAsync` with a fresh registry —
 * mirrors `onboarding.test.ts`.
 */

const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock("@/src/storage/keys", () => ({
  appStorage: {
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
  },
}));

type PrefsModule = typeof import("./bookListPrefs");

async function withFreshPrefs(fn: (mod: PrefsModule) => Promise<void>) {
  await jest.isolateModulesAsync(async () => {
    const mod = require("./bookListPrefs") as PrefsModule;
    await fn(mod);
  });
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  mockGet.mockReset();
  mockSet.mockReset();
  mockSet.mockResolvedValue(true);
});

describe("normalizeBookListPrefs", () => {
  it("keeps valid values and falls back per field", () => {
    const { normalizeBookListPrefs } = require("./bookListPrefs") as PrefsModule;
    expect(normalizeBookListPrefs({ testament: "new", sortOrder: "alphabetical" })).toEqual({
      testament: "new",
      sortOrder: "alphabetical",
    });
    expect(normalizeBookListPrefs({ testament: "apocrypha", sortOrder: "alphabetical" })).toEqual({
      testament: "all",
      sortOrder: "alphabetical",
    });
    expect(normalizeBookListPrefs(null)).toEqual({ testament: "all", sortOrder: "numerical" });
  });
});

describe("store", () => {
  it("hydrates stored prefs", async () => {
    mockGet.mockResolvedValue({ testament: "old", sortOrder: "alphabetical" });
    await withFreshPrefs(async (mod) => {
      mod.initBookListPrefs();
      await flush();
      expect(mod.useBookListPrefsStore.getState().prefs).toEqual({
        testament: "old",
        sortOrder: "alphabetical",
      });
    });
  });

  it("persists the whole object on change", async () => {
    mockGet.mockResolvedValue(null);
    await withFreshPrefs(async (mod) => {
      mod.bookListPrefsActions.setSortOrder("alphabetical");
      expect(mockSet).toHaveBeenCalledWith("bookListPrefs", {
        testament: "all",
        sortOrder: "alphabetical",
      });
    });
  });

  it("does not let a late hydrate overwrite a choice made meanwhile", async () => {
    let resolveGet: (value: unknown) => void = () => {};
    mockGet.mockReturnValue(new Promise((resolve) => (resolveGet = resolve)));
    await withFreshPrefs(async (mod) => {
      mod.initBookListPrefs();
      mod.bookListPrefsActions.setTestament("new");
      resolveGet({ testament: "old", sortOrder: "alphabetical" });
      await flush();
      expect(mod.useBookListPrefsStore.getState().prefs).toEqual({
        testament: "new",
        sortOrder: "numerical",
      });
    });
  });
});
