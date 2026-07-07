import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Bible, computeBookRecency, type InsightsLogEntry } from "@mybiblelog/shared";
import { radius, recencyByScheme, spacing, useTheme } from "@/src/design";
import { Text } from "../atoms/Text";
import { ListItem } from "../molecules/ListItem";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { SelectRow } from "../molecules/SelectRow";
import { SelectSheet } from "./SelectSheet";
import { getRelativeDateInfo } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";

type SortOrder = "bible" | "alpha" | "recent" | "oldest";
type Timeframe = number | "all";
type Testament = "all" | "old" | "new";
type T = ReturnType<typeof useT>;

const TIMEFRAME_OPTIONS = [30, 60, 90, 180, 365];

const newTestamentBooks = new Set(
  Bible.getBooks()
    .filter((book) => book.newTestament)
    .map((book) => book.bibleOrder)
);

const stripLeadingNumbers = (str: string) => str.replace(/^\d+\s*/, "").trim();

function formatRelative(t: T, ymd: string): string {
  const info = getRelativeDateInfo(ymd);
  if (!info) return ymd;
  switch (info.unit) {
    case "today":
      return t("insights_books_today");
    case "yesterday":
      return t("insights_books_yesterday");
    case "days":
      return info.count === 1
        ? t("insights_books_days_ago_one")
        : t("insights_books_days_ago_other", { count: info.count });
    case "weeks":
      return info.count === 1
        ? t("insights_books_weeks_ago_one")
        : t("insights_books_weeks_ago_other", { count: info.count });
    case "months":
      return info.count === 1
        ? t("insights_books_months_ago_one")
        : t("insights_books_months_ago_other", { count: info.count });
    case "years":
      return info.count === 1
        ? t("insights_books_years_ago_one")
        : t("insights_books_years_ago_other", { count: info.count });
  }
}

export function BookRecencyList({ entries }: { entries: InsightsLogEntry[] }) {
  const t = useT();
  const { locale } = useLocale();
  const { colors, scheme } = useTheme();
  const recency = recencyByScheme[scheme];
  const [days, setDays] = useState<Timeframe>(365);
  const [testament, setTestament] = useState<Testament>("all");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [timeframeSheetOpen, setTimeframeSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const timeframeOptions = [
    ...TIMEFRAME_OPTIONS.map((n) => ({
      value: n as Timeframe,
      label: t("insights_books_last_n_days", { count: n }),
    })),
    { value: "all" as Timeframe, label: t("insights_books_all_time") },
  ];

  const testamentOptions = [
    { value: "all" as const, label: t("insights_books_whole_bible") },
    { value: "old" as const, label: t("insights_books_old_testament") },
    { value: "new" as const, label: t("insights_books_new_testament") },
  ];

  const sortOptions = [
    { value: "bible" as const, label: t("insights_books_sort_bible_order") },
    { value: "alpha" as const, label: t("insights_books_sort_alphabetical") },
    { value: "recent" as const, label: t("insights_books_sort_most_recent") },
    { value: "oldest" as const, label: t("insights_books_sort_least_recent") },
  ];

  const rows = useMemo(() => {
    const endDate = dayjs().format("YYYY-MM-DD");
    const startDate =
      days === "all"
        ? entries.reduce((min, e) => (e.date < min ? e.date : min), endDate)
        : dayjs()
            .subtract(days - 1, "day")
            .format("YYYY-MM-DD");

    const data = computeBookRecency(entries, startDate, endDate)
      .filter((book) => {
        if (testament === "old") return !newTestamentBooks.has(book.bookIndex);
        if (testament === "new") return newTestamentBooks.has(book.bookIndex);
        return true;
      })
      .map((book) => ({
        bookIndex: book.bookIndex,
        bookName: Bible.getBookName(book.bookIndex, locale),
        level: book.level,
        lastReadDate: book.lastReadDate,
      }));

    return data.sort((a, b) => {
      if (sort === "bible") return a.bookIndex - b.bookIndex;
      if (sort === "alpha") {
        return stripLeadingNumbers(a.bookName).localeCompare(
          stripLeadingNumbers(b.bookName),
          locale
        );
      }
      // Books not read in the timeframe always sort last.
      if (!a.lastReadDate && !b.lastReadDate) return a.bookIndex - b.bookIndex;
      if (!a.lastReadDate) return 1;
      if (!b.lastReadDate) return -1;
      return sort === "recent"
        ? b.lastReadDate.localeCompare(a.lastReadDate)
        : a.lastReadDate.localeCompare(b.lastReadDate);
    });
  }, [entries, days, testament, sort, locale]);

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <SelectRow
          label={t("insights_books_timeframe_label")}
          value={timeframeOptions.find((o) => o.value === days)?.label}
          placeholder={t("insights_books_timeframe_label")}
          onPress={() => setTimeframeSheetOpen(true)}
          testID="insights.books-timeframe-row"
        />
        <SegmentedControl
          label={t("insights_books_testament_label")}
          options={testamentOptions}
          value={testament}
          onChange={setTestament}
        />
        <SelectRow
          label={t("insights_books_sort_label")}
          value={sortOptions.find((o) => o.value === sort)?.label}
          placeholder={t("insights_books_sort_label")}
          onPress={() => setSortSheetOpen(true)}
          testID="insights.books-sort-row"
        />
      </View>

      <View style={styles.legend}>
        <Text variant="caption" color="mutedText">
          {t("insights_books_less_recent")}
        </Text>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[styles.swatch, { backgroundColor: recency[level], borderColor: colors.border }]}
          />
        ))}
        <Text variant="caption" color="mutedText">
          {t("insights_books_more_recent")}
        </Text>
        <View
          style={[
            styles.swatch,
            styles.legendGap,
            { backgroundColor: recency[0], borderColor: colors.border },
          ]}
        />
        <Text variant="caption" color="mutedText">
          {t("insights_books_not_read")}
        </Text>
      </View>

      <View style={styles.list}>
        {rows.map((row) => (
          <ListItem
            key={row.bookIndex}
            title={row.bookName}
            subtitle={
              row.level > 0
                ? formatRelative(t, row.lastReadDate!)
                : t("insights_books_not_read_in_timeframe")
            }
            leading={
              <View
                testID={`insights.books-swatch.${row.bookIndex}`}
                style={[
                  styles.swatch,
                  { backgroundColor: recency[row.level], borderColor: colors.border },
                ]}
              />
            }
            bordered={false}
          />
        ))}
      </View>

      <SelectSheet
        visible={timeframeSheetOpen}
        title={t("insights_books_timeframe_label")}
        options={timeframeOptions}
        selectedValue={days}
        onSelect={setDays}
        onClose={() => setTimeframeSheetOpen(false)}
      />
      <SelectSheet
        visible={sortSheetOpen}
        title={t("insights_books_sort_label")}
        options={sortOptions}
        selectedValue={sort}
        onSelect={setSort}
        onClose={() => setSortSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  controls: { gap: spacing.md },
  legend: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  legendGap: { marginLeft: spacing.sm },
  list: { gap: spacing.xs },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
});
