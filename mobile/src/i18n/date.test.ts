import { formatLongDate, getRelativeDateInfo, getWeekdayIndex, parseYmdToDate } from "./date";

describe("parseYmdToDate", () => {
  it("parses YYYY-MM-DD without timezone shifts", () => {
    const d = parseYmdToDate("2026-06-27");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(5);
    expect(d?.getDate()).toBe(27);
  });

  it("returns null for malformed input", () => {
    expect(parseYmdToDate("not-a-date")).toBeNull();
    expect(parseYmdToDate("2026-06")).toBeNull();
    expect(parseYmdToDate("")).toBeNull();
  });
});

describe("formatLongDate", () => {
  it("formats per locale", () => {
    expect(formatLongDate("2026-06-27", "en")).toBe("June 27, 2026");
  });

  it("returns the input unchanged when unparseable", () => {
    expect(formatLongDate("garbage", "en")).toBe("garbage");
  });

  it("reuses a cached formatter per locale (same output across calls)", () => {
    expect(formatLongDate("2026-01-02", "en")).toBe(formatLongDate("2026-01-02", "en"));
  });
});

describe("getRelativeDateInfo", () => {
  const toYmd = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return toYmd(d);
  };

  it("returns null for malformed input", () => {
    expect(getRelativeDateInfo("garbage")).toBeNull();
  });

  it("buckets today and yesterday specially", () => {
    expect(getRelativeDateInfo(daysAgo(0))).toEqual({ unit: "today" });
    expect(getRelativeDateInfo(daysAgo(1))).toEqual({ unit: "yesterday" });
  });

  it("buckets days, weeks, months, and years", () => {
    expect(getRelativeDateInfo(daysAgo(3))).toEqual({ unit: "days", count: 3 });
    expect(getRelativeDateInfo(daysAgo(14))).toEqual({ unit: "weeks", count: 2 });
    expect(getRelativeDateInfo(daysAgo(60))).toEqual({ unit: "months", count: 2 });
    expect(getRelativeDateInfo(daysAgo(730))).toEqual({ unit: "years", count: 2 });
  });
});

describe("getWeekdayIndex", () => {
  it("returns the JS weekday (Sunday=0)", () => {
    expect(getWeekdayIndex("2026-06-28")).toBe(0); // a Sunday
    expect(getWeekdayIndex("2026-06-29")).toBe(1); // a Monday
  });

  it("returns 0 for malformed input", () => {
    expect(getWeekdayIndex("nope")).toBe(0);
  });
});
