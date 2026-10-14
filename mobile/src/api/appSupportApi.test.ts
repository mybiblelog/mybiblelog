import Constants from "expo-constants";
import { Platform } from "react-native";

import { fetchAppSupportStatus } from "./appSupportApi";

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  });
}

const validStatus = {
  platform: "ios",
  current: { version: "1.2.3" },
  minimumSupported: { version: "1.0.0" },
  supported: true,
  forceUpgrade: false,
};

beforeEach(() => {
  global.fetch = jest.fn();
  Platform.OS = "ios";
  // The global mock in jest.setup.ts has no `version`; set one so
  // fetchAppSupportStatus proceeds to call fetch.
  (Constants.expoConfig as { version?: string }).version = "1.2.3";
});

describe("fetchAppSupportStatus", () => {
  it("returns the parsed status on a successful response", async () => {
    mockFetchOnce({ data: validStatus });
    await expect(fetchAppSupportStatus()).resolves.toEqual(validStatus);
  });

  it("returns null on a non-OK response", async () => {
    mockFetchOnce({ data: validStatus }, false, 500);
    await expect(fetchAppSupportStatus()).resolves.toBeNull();
  });

  it("returns null when the response platform doesn't match the request", async () => {
    mockFetchOnce({ data: { ...validStatus, platform: "android" } });
    await expect(fetchAppSupportStatus()).resolves.toBeNull();
  });

  it("returns null when forceUpgrade is not a boolean", async () => {
    mockFetchOnce({ data: { ...validStatus, forceUpgrade: "yes" } });
    await expect(fetchAppSupportStatus()).resolves.toBeNull();
  });

  it("returns null when supported is not a boolean", async () => {
    mockFetchOnce({ data: { ...validStatus, supported: "yes" } });
    await expect(fetchAppSupportStatus()).resolves.toBeNull();
  });

  it("returns null when data is missing", async () => {
    mockFetchOnce({});
    await expect(fetchAppSupportStatus()).resolves.toBeNull();
  });

  it("returns null when data is malformed (not an object)", async () => {
    mockFetchOnce({ data: "not-an-object" });
    await expect(fetchAppSupportStatus()).resolves.toBeNull();
  });

  it("returns null when fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(fetchAppSupportStatus()).resolves.toBeNull();
  });

  it("returns null without calling fetch when the platform is unsupported", async () => {
    Platform.OS = "web";
    await expect(fetchAppSupportStatus()).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns null without calling fetch when the app version is missing", async () => {
    (Constants.expoConfig as { version?: string }).version = undefined;
    await expect(fetchAppSupportStatus()).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
