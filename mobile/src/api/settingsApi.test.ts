jest.mock("@/src/api/httpClient", () => ({
  httpClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

import { httpClient } from "@/src/api/httpClient";
import { deleteAccount, getSettings, parseServerUserSettings, updateSettings } from "./settingsApi";

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe("parseServerUserSettings", () => {
  it("passes through valid fields", () => {
    expect(
      parseServerUserSettings({
        dailyVerseCountGoal: 100,
        lookBackDate: "2020-01-01",
        preferredBibleVersion: "ESV",
        startPage: "today",
        locale: "en",
      })
    ).toEqual({
      dailyVerseCountGoal: 100,
      lookBackDate: "2020-01-01",
      preferredBibleVersion: "ESV",
      startPage: "today",
      locale: "en",
    });
  });

  it("coerces a numeric goal that arrives as a string", () => {
    expect(parseServerUserSettings({ dailyVerseCountGoal: "42" })?.dailyVerseCountGoal).toBe(42);
  });

  it("drops a non-numeric goal", () => {
    expect(
      parseServerUserSettings({ dailyVerseCountGoal: "abc" })?.dailyVerseCountGoal
    ).toBeUndefined();
  });

  it("returns null for non-object input", () => {
    expect(parseServerUserSettings(null)).toBeNull();
    expect(parseServerUserSettings("x")).toBeNull();
  });
});

describe("getSettings", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the parsed settings on success", async () => {
    mockedHttpClient.get.mockResolvedValue({ data: { locale: "en" } });
    expect(await getSettings()).toEqual(expect.objectContaining({ locale: "en" }));
  });

  it("throws when the response fails parseServerUserSettings", async () => {
    mockedHttpClient.get.mockResolvedValue({ data: null });
    await expect(getSettings()).rejects.toThrow("GET /settings returned unexpected payload");
  });
});

describe("updateSettings", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the parsed settings on success", async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: { locale: "es" } });
    expect(await updateSettings({ locale: "es" })).toEqual(
      expect.objectContaining({ locale: "es" })
    );
    expect(mockedHttpClient.patch).toHaveBeenCalledWith("/api/settings", {
      settings: { locale: "es" },
    });
  });

  it("throws when the response fails parseServerUserSettings", async () => {
    mockedHttpClient.patch.mockResolvedValue({ data: "nope" });
    await expect(updateSettings({ locale: "es" })).rejects.toThrow(
      "PATCH /settings returned unexpected payload"
    );
  });
});

describe("deleteAccount", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls DELETE /settings/account", async () => {
    mockedHttpClient.delete.mockResolvedValue({ data: undefined });
    await deleteAccount();
    expect(mockedHttpClient.delete).toHaveBeenCalledWith("/api/settings/account");
  });
});
