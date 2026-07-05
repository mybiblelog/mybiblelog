import { Bible, type DateVerseCountsMap } from "@mybiblelog/shared";
import dayjs from "dayjs";
import {
  getGoalPlan,
  getHistoricalOutlook,
  getRecentOutlook,
  getTodayOutlook,
  getUnreadVerseCount,
  getVersesRead,
  type OutlookEntry,
} from "./outlook";

const TODAY = "2026-07-03";
const LOOK_BACK = "2026-06-03"; // 30 days before today

const genesis1 = (date: string): OutlookEntry => ({
  startVerseId: Bible.makeVerseId(1, 1, 1),
  endVerseId: Bible.makeVerseId(1, 1, 31),
  date,
});

describe("getVersesRead / getUnreadVerseCount", () => {
  it("counts unique verses only from entries on or after the look-back date", () => {
    const entries = [genesis1("2026-06-10"), genesis1("2026-01-01")];
    expect(getVersesRead(entries, LOOK_BACK)).toBe(31);
    expect(getUnreadVerseCount(entries, LOOK_BACK)).toBe(Bible.getTotalVerseCount() - 31);
  });

  it("returns the full Bible as unread with no entries", () => {
    expect(getUnreadVerseCount([], LOOK_BACK)).toBe(Bible.getTotalVerseCount());
  });
});

describe("getHistoricalOutlook", () => {
  it("computes days since look-back and the floored daily average", () => {
    const entries = [genesis1("2026-06-10")];
    const outlook = getHistoricalOutlook(entries, LOOK_BACK, TODAY);
    expect(outlook.daysSinceLookBack).toBe(30);
    expect(outlook.averageDailyVerses).toBe(Math.floor(31 / 30)); // 1
    const expectedDays = Math.ceil((Bible.getTotalVerseCount() - 31) / 1);
    expect(outlook.daysToFinish).toBe(expectedDays);
    expect(outlook.finishDate).toBe(dayjs(TODAY).add(expectedDays, "day").format("YYYY-MM-DD"));
  });

  it("projects never at a zero rate", () => {
    const outlook = getHistoricalOutlook([], LOOK_BACK, TODAY);
    expect(outlook.averageDailyVerses).toBe(0);
    expect(outlook.daysToFinish).toBeNull();
    expect(outlook.finishDate).toBeNull();
  });

  it("does not divide by zero when the look-back date is today", () => {
    const outlook = getHistoricalOutlook([genesis1(TODAY)], TODAY, TODAY);
    expect(outlook.daysSinceLookBack).toBe(0);
    expect(outlook.averageDailyVerses).toBe(0);
    expect(outlook.daysToFinish).toBeNull();
  });
});

describe("getRecentOutlook", () => {
  const countsFor = (dates: Record<string, number>): DateVerseCountsMap =>
    Object.fromEntries(
      Object.entries(dates).map(([date, unique]) => [date, { total: unique, unique }])
    );

  it("averages the per-date unique counts over the window", () => {
    // 70 unique verses over the past 7 days -> 10/day.
    const counts = countsFor({
      "2026-07-01": 30,
      "2026-06-28": 40,
    });
    const outlook = getRecentOutlook(counts, [], LOOK_BACK, TODAY, 7);
    expect(outlook.averageDailyVerses).toBe(10);
    expect(outlook.daysToFinish).toBe(Math.ceil(Bible.getTotalVerseCount() / 10));
  });

  it("clamps the window at the look-back date", () => {
    // Look-back was 5 days ago; a 30-day window must average over 5 days.
    const lookBack = "2026-06-28";
    const counts = countsFor({ "2026-06-30": 50 });
    const outlook = getRecentOutlook(counts, [], lookBack, TODAY, 30);
    expect(outlook.averageDailyVerses).toBe(10);
  });

  it("ignores counts outside the window", () => {
    const counts = countsFor({ "2026-06-01": 700 });
    const outlook = getRecentOutlook(counts, [], LOOK_BACK, TODAY, 7);
    expect(outlook.averageDailyVerses).toBe(0);
    expect(outlook.daysToFinish).toBeNull();
  });

  it("returns a zero average when the look-back date is today", () => {
    const outlook = getRecentOutlook({}, [], TODAY, TODAY, 7);
    expect(outlook.averageDailyVerses).toBe(0);
  });
});

describe("getTodayOutlook", () => {
  it("counts only verses newly read today", () => {
    const entries = [
      genesis1("2026-06-10"),
      // Re-reading Genesis 1 today adds nothing; Genesis 2:1-10 adds 10.
      genesis1(TODAY),
      {
        startVerseId: Bible.makeVerseId(1, 2, 1),
        endVerseId: Bible.makeVerseId(1, 2, 10),
        date: TODAY,
      },
    ];
    const outlook = getTodayOutlook(entries, LOOK_BACK, TODAY);
    expect(outlook.newVersesToday).toBe(10);
    expect(outlook.daysToFinish).toBe(Math.ceil((Bible.getTotalVerseCount() - 41) / 10));
  });

  it("projects never when nothing new was read today", () => {
    const outlook = getTodayOutlook([genesis1("2026-06-10")], LOOK_BACK, TODAY);
    expect(outlook.newVersesToday).toBe(0);
    expect(outlook.daysToFinish).toBeNull();
    expect(outlook.finishDate).toBeNull();
  });
});

describe("getGoalPlan", () => {
  it("computes days and ceiled verses per day for a future date", () => {
    expect(getGoalPlan(1000, TODAY, "2026-07-10")).toEqual({
      days: 7,
      versesPerDay: Math.ceil(1000 / 7),
    });
  });

  it("returns null for today or past dates", () => {
    expect(getGoalPlan(1000, TODAY, TODAY)).toBeNull();
    expect(getGoalPlan(1000, TODAY, "2026-07-01")).toBeNull();
  });
});
