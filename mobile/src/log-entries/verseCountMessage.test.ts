import { en } from "@/src/i18n/en";
import type { TranslationKey } from "@/src/i18n";
import { formatVerseCountMessage } from "./verseCountMessage";

/** Resolves against the real English strings, so wording changes surface here. */
const t = (key: TranslationKey) => en[key as keyof typeof en] as string;

describe("formatVerseCountMessage", () => {
  it("reports just the count when nothing is new", () => {
    expect(formatVerseCountMessage(t, { count: 12 })).toBe("12 verses");
    expect(formatVerseCountMessage(t, { count: 12, newVerseCount: 0 })).toBe("12 verses");
  });

  it("reports the new portion when a passage is partly re-read", () => {
    expect(formatVerseCountMessage(t, { count: 12, newVerseCount: 5 })).toBe("12 verses - 5 new");
  });

  it('says "all new" rather than repeating the count', () => {
    // "12 verses - 12 new" reads like a coincidence; "all new" reads like an
    // achievement. Web makes the same distinction.
    expect(formatVerseCountMessage(t, { count: 12, newVerseCount: 12 })).toBe(
      "12 verses - all new"
    );
  });

  it("singularizes a one-verse passage", () => {
    expect(formatVerseCountMessage(t, { count: 1 })).toBe("1 verse");
    expect(formatVerseCountMessage(t, { count: 1, newVerseCount: 1 })).toBe("1 verse - all new");
  });
});
