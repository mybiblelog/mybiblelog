import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Bible, computeBookFrequencies, type InsightsLogEntry } from "@mybiblelog/shared";
import { spacing } from "@/src/design";
import { ProgressBar } from "../atoms/ProgressBar";
import { Text } from "../atoms/Text";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { SelectRow } from "../molecules/SelectRow";
import { SelectSheet } from "./SelectSheet";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";

type SortOrder = "bible" | "alpha" | "most" | "least";
type Metric = "raw" | "proportional";

const TIMEFRAME_OPTIONS = [30, 60, 90, 180, 365];

const stripLeadingNumbers = (str: string) => str.replace(/^\d+\s*/, "").trim();

export function BookFrequencyChart({ entries }: { entries: InsightsLogEntry[] }) {
  const t = useT();
  const { locale } = useLocale();
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<Metric>("raw");
  const [sort, setSort] = useState<SortOrder>("bible");
  const [timeframeSheetOpen, setTimeframeSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const timeframeOptions = TIMEFRAME_OPTIONS.map((n) => ({
    value: n,
    label: t("insights_frequency_last_n_days", { count: n }),
  }));

  const sortOptions = [
    { value: "bible" as const, label: t("insights_frequency_sort_bible_order") },
    { value: "alpha" as const, label: t("insights_frequency_sort_alphabetical") },
    { value: "most" as const, label: t("insights_frequency_sort_most_read") },
    { value: "least" as const, label: t("insights_frequency_sort_least_read") },
  ];

  const rows = useMemo(() => {
    const endDate = dayjs().format("YYYY-MM-DD");
    const startDate = dayjs()
      .subtract(days - 1, "day")
      .format("YYYY-MM-DD");
    const frequencies = computeBookFrequencies(entries, startDate, endDate);

    const useProportion = metric === "proportional";
    const enriched = frequencies.map((freq) => ({
      bookIndex: freq.bookIndex,
      bookName: Bible.getBookName(freq.bookIndex, locale),
      value: useProportion ? freq.proportion : freq.verseCount,
      label: useProportion ? `${Math.round(freq.proportion * 100)}%` : String(freq.verseCount),
    }));

    switch (sort) {
      case "alpha":
        return enriched.sort((a, b) =>
          stripLeadingNumbers(a.bookName).localeCompare(stripLeadingNumbers(b.bookName), locale)
        );
      case "most":
        return enriched.sort((a, b) => b.value - a.value || a.bookIndex - b.bookIndex);
      case "least":
        return enriched.sort((a, b) => a.value - b.value || a.bookIndex - b.bookIndex);
      case "bible":
      default:
        return enriched.sort((a, b) => a.bookIndex - b.bookIndex);
    }
  }, [entries, days, metric, sort, locale]);

  const max = useMemo(() => rows.reduce((m, r) => Math.max(m, r.value), 0), [rows]);

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <SelectRow
          label={t("insights_frequency_timeframe_label")}
          value={timeframeOptions.find((o) => o.value === days)?.label}
          placeholder={t("insights_frequency_timeframe_label")}
          onPress={() => setTimeframeSheetOpen(true)}
          testID="insights.frequency-timeframe-row"
        />
        <SegmentedControl
          label={t("insights_frequency_metric_label")}
          options={[
            { value: "raw" as const, label: t("insights_frequency_metric_raw") },
            { value: "proportional" as const, label: t("insights_frequency_metric_proportional") },
          ]}
          value={metric}
          onChange={setMetric}
        />
        <SelectRow
          label={t("insights_frequency_sort_label")}
          value={sortOptions.find((o) => o.value === sort)?.label}
          placeholder={t("insights_frequency_sort_label")}
          onPress={() => setSortSheetOpen(true)}
          testID="insights.frequency-sort-row"
        />
      </View>

      <View style={styles.rows}>
        {rows.map((row) => (
          <View key={row.bookIndex} style={styles.row}>
            <Text variant="caption" numberOfLines={1} style={styles.name}>
              {row.bookName}
            </Text>
            <ProgressBar
              progress={max > 0 ? row.value / max : 0}
              color="success"
              height={14}
              style={styles.bar}
            />
            <Text variant="caption" color="mutedText" style={styles.value}>
              {row.label}
            </Text>
          </View>
        ))}
      </View>

      <SelectSheet
        visible={timeframeSheetOpen}
        title={t("insights_frequency_timeframe_label")}
        options={timeframeOptions}
        selectedValue={days}
        onSelect={setDays}
        onClose={() => setTimeframeSheetOpen(false)}
      />
      <SelectSheet
        visible={sortSheetOpen}
        title={t("insights_frequency_sort_label")}
        options={sortOptions}
        selectedValue={sort}
        onSelect={setSort}
        onClose={() => setSortSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  controls: { gap: spacing.md },
  rows: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { width: 88 },
  bar: { flex: 1 },
  value: { width: 44, textAlign: "right" },
});
