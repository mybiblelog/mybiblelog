/**
 * Validation for runtime env config. The values arrive via `app.config.ts` ->
 * Expo `extra`; `config.ts` is the single place that requires them (so
 * `expo config` can be evaluated without a local `.env`). These tests re-import
 * the module under different `expo-constants` mocks to exercise the throw path.
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
  });

  it("does not require the optional iOS client ID", () => {
    const mod = loadConfigWith({
      apiBaseUrl: "http://localhost:3000",
      googleWebClientId: "web-id",
    });
    expect(mod.GOOGLE_IOS_CLIENT_ID).toBeUndefined();
  });

  it("throws naming the missing env var(s) when a required key is absent", () => {
    expect(() => loadConfigWith({ apiBaseUrl: "http://localhost:3000" })).toThrow(
      /EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID/,
    );
    expect(() => loadConfigWith({})).toThrow(
      /EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID/,
    );
  });

  it("treats blank values as missing", () => {
    expect(() =>
      loadConfigWith({ apiBaseUrl: "   ", googleWebClientId: "web-id" }),
    ).toThrow(/EXPO_PUBLIC_API_BASE_URL/);
  });
});
