import { Linking, Platform } from "react-native";
import { Bible, BibleApps, BibleVersions } from "@mybiblelog/shared";
import { openPassageInBible } from "./openInBible";

// Spy on just the two react-native bits this module touches, rather than
// mocking the whole module — re-requiring "react-native" from scratch trips
// up jest-expo's native module registry (e.g. DevMenu).
const openURL = jest.spyOn(Linking, "openURL");

const startVerseId = Bible.makeVerseId(1, 1, 1); // Genesis 1:1
const endVerseId = Bible.makeVerseId(1, 1, 5);
const invalidVerseId = Bible.makeVerseId(0, 0, 0);

beforeEach(() => {
  openURL.mockReset();
  Platform.OS = "ios";
});

describe("openPassageInBible", () => {
  it("returns false without opening anything for an unparseable start verse", async () => {
    const result = await openPassageInBible(invalidVerseId, invalidVerseId, {});

    expect(result).toBe(false);
    expect(openURL).not.toHaveBeenCalled();
  });

  it("opens the primary link and returns true on success", async () => {
    openURL.mockResolvedValueOnce(undefined);

    const result = await openPassageInBible(startVerseId, endVerseId, {
      preferredBibleApp: BibleApps.BIBLEGATEWAY,
      preferredBibleVersion: BibleVersions.NASB2020,
    });

    expect(result).toBe(true);
    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL.mock.calls[0][0]).toContain("biblegateway.com");
  });

  it("falls back to the secondary app when the primary link fails", async () => {
    openURL.mockRejectedValueOnce(new Error("no handler")).mockResolvedValueOnce(undefined);

    const result = await openPassageInBible(startVerseId, endVerseId, {
      preferredBibleApp: BibleApps.YOUVERSIONAPP,
      preferredBibleVersion: BibleVersions.NASB2020,
    });

    expect(result).toBe(true);
    expect(openURL).toHaveBeenCalledTimes(2);
    // YOUVERSIONAPP's fallback is BIBLECOM.
    expect(openURL.mock.calls[1][0]).toContain("bible.com");
  });

  it("returns false when both the primary and fallback links fail", async () => {
    openURL
      .mockRejectedValueOnce(new Error("no handler"))
      .mockRejectedValueOnce(new Error("no handler"));

    const result = await openPassageInBible(startVerseId, endVerseId, {
      preferredBibleApp: BibleApps.YOUVERSIONAPP,
      preferredBibleVersion: BibleVersions.NASB2020,
    });

    expect(result).toBe(false);
    expect(openURL).toHaveBeenCalledTimes(2);
  });

  describe("app/version normalization", () => {
    it("uses the device default app when no valid preference is given (android)", async () => {
      Platform.OS = "android";
      openURL.mockResolvedValueOnce(undefined);

      await openPassageInBible(startVerseId, endVerseId, { preferredBibleApp: "NOT_A_REAL_APP" });

      // Android default is the YouVersion deep link.
      expect(openURL.mock.calls[0][0]).toContain("youversion://");
    });

    it("uses the device default app when no valid preference is given (non-android)", async () => {
      Platform.OS = "ios";
      openURL.mockResolvedValueOnce(undefined);

      await openPassageInBible(startVerseId, endVerseId, { preferredBibleApp: undefined });

      // Non-android default is Bible Gateway.
      expect(openURL.mock.calls[0][0]).toContain("biblegateway.com");
    });

    it("passes through a valid app preference", async () => {
      openURL.mockResolvedValueOnce(undefined);

      await openPassageInBible(startVerseId, endVerseId, { preferredBibleApp: BibleApps.LOGOS });

      expect(openURL.mock.calls[0][0]).toContain("ref.ly");
    });

    it("falls back to the default version for an invalid version preference", async () => {
      openURL.mockResolvedValueOnce(undefined);

      await openPassageInBible(startVerseId, endVerseId, {
        preferredBibleApp: BibleApps.BIBLEGATEWAY,
        preferredBibleVersion: "NOT_A_REAL_VERSION",
      });

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL.mock.calls[0][0]).toContain("biblegateway.com");
    });

    it("passes through a valid version preference", async () => {
      openURL.mockResolvedValueOnce(undefined);

      await openPassageInBible(startVerseId, endVerseId, {
        preferredBibleApp: BibleApps.BIBLEGATEWAY,
        preferredBibleVersion: BibleVersions.KJV,
      });

      expect(openURL.mock.calls[0][0]).toContain("version=KJV");
    });
  });
});
