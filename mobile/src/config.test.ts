/**
 * Validation for runtime env config. The values arrive via `app.config.ts` ->
 * Expo `extra`; `config.ts` is the single place that requires them. These tests
 * re-import the module under different `expo-constants` mocks.
 *
 * Importing must never throw: `app/_layout.tsx` imports this at module scope, so
 * a throw kills the app before React mounts (see `MISSING_CONFIG`). The missing
 * vars are reported instead, and the root layout renders `ConfigErrorScreen`.
 */

function loadConfigWith(extra: Record<string, unknown> | undefined) {
  let mod: typeof import("./config");
  jest.isolateModules(() => {
    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: { expoConfig: extra === undefined ? {} : { extra } },
    }));
    mod = require("./config");
  });
  return mod!;
}

afterEach(() => {
  jest.dontMock("expo-constants");
});

describe("config validation", () => {
  it("exposes the configured values when required keys are present", () => {
    const mod = loadConfigWith({
      apiBaseUrl: "http://localhost:3000",
      googleWebClientId: "web-id",
      googleIosClientId: "ios-id",
    });
    expect(mod.API_BASE_URL).toBe("http://localhost:3000");
    expect(mod.GOOGLE_WEB_CLIENT_ID).toBe("web-id");
    expect(mod.GOOGLE_IOS_CLIENT_ID).toBe("ios-id");
    expect(mod.MISSING_CONFIG).toEqual([]);
  });

  it("does not require the optional iOS client ID", () => {
    const mod = loadConfigWith({
      apiBaseUrl: "http://localhost:3000",
      googleWebClientId: "web-id",
    });
    expect(mod.GOOGLE_IOS_CLIENT_ID).toBeUndefined();
  });

  it("reports the missing env var(s) by name when a required key is absent", () => {
    expect(loadConfigWith({ apiBaseUrl: "http://localhost:3000" }).MISSING_CONFIG).toEqual([
      "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
    ]);
    expect(loadConfigWith({}).MISSING_CONFIG).toEqual([
      "EXPO_PUBLIC_API_BASE_URL",
      "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
    ]);
  });

  it("treats blank values as missing", () => {
    expect(
      loadConfigWith({ apiBaseUrl: "   ", googleWebClientId: "web-id" }).MISSING_CONFIG
    ).toEqual(["EXPO_PUBLIC_API_BASE_URL"]);
  });

  it("does not throw on import when required keys are absent", () => {
    // The whole point of MISSING_CONFIG: `app/_layout.tsx` imports this module at
    // module scope, so a throw here kills the app before it can render why.
    expect(() => loadConfigWith({})).not.toThrow();
    expect(loadConfigWith({}).API_BASE_URL).toBe("");
  });
});
