import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Bible, computeBookLastRead, type InsightsLogEntry } from "@mybiblelog/shared";
import { spacing } from "@/src/design";
import { ListItem } from "../molecules/ListItem";
import { SelectRow } from "../molecules/SelectRow";
import { SelectSheet } from "./SelectSheet";
import { formatLongDate, getRelativeDateInfo } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";

type SortOrder = "bible" | "alpha" | "recent" | "oldest";
type T = ReturnType<typeof useT>;

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
  const [sort, setSort] = useState<SortOrder>("recent");
  const [sheetOpen, setSheetOpen] = useState(false);

  const sortOptions = [
    { value: "bible" as const, label: t("insights_books_sort_bible_order") },
    { value: "alpha" as const, label: t("insights_books_sort_alphabetical") },
    { value: "recent" as const, label: t("insights_books_sort_most_recent") },
    { value: "oldest" as const, label: t("insights_books_sort_least_recent") },
  ];

  const rows = useMemo(() => {
    const data = computeBookLastRead(entries).map((book) => ({
      bookIndex: book.bookIndex,
      bookName: Bible.getBookName(book.bookIndex, locale),
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
      if (!a.lastReadDate && !b.lastReadDate) return a.bookIndex - b.bookIndex;
      if (!a.lastReadDate) return 1;
      if (!b.lastReadDate) return -1;
      return sort === "recent"
        ? b.lastReadDate.localeCompare(a.lastReadDate)
        : a.lastReadDate.localeCompare(b.lastReadDate);
    });
  }, [entries, sort, locale]);

  return (
    <View style={styles.container}>
      <SelectRow
        label={t("insights_books_sort_label")}
        value={sortOptions.find((o) => o.value === sort)?.label}
        placeholder={t("insights_books_sort_label")}
        onPress={() => setSheetOpen(true)}
        testID="insights.books-sort-row"
      />
      <View style={styles.list}>
        {rows.map((row) => (
          <ListItem
            key={row.bookIndex}
            title={row.bookName}
            subtitle={
              row.lastReadDate
                ? `${formatRelative(t, row.lastReadDate)} · ${formatLongDate(row.lastReadDate, locale)}`
                : t("insights_books_never_read")
            }
            bordered={false}
          />
        ))}
      </View>

      <SelectSheet
        visible={sheetOpen}
        title={t("insights_books_sort_label")}
        options={sortOptions}
        selectedValue={sort}
        onSelect={setSort}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  list: { gap: spacing.xs },
});
