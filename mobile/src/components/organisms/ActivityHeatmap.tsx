import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  buildContributionCalendar,
  type HeatmapCell,
  type InsightsLogEntry,
} from "@mybiblelog/shared";
import { spacing, useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";
import { Text } from "../atoms/Text";
import { formatLongDate } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEKDAY_LABEL_OFFSETS = [1, 3, 5]; // Mon, Wed, Fri

const HEAT_LEVEL_OPACITY = [0, 0.28, 0.52, 0.76, 1] as const;

function heatCellStyle(level: number, future: boolean, colors: ThemeColors) {
  if (future) return { backgroundColor: "transparent" };
  if (level === 0) return { backgroundColor: colors.surfaceAlt };
  return { backgroundColor: colors.success, opacity: HEAT_LEVEL_OPACITY[level] };
}

const monthFormatters = new Map<string, Intl.DateTimeFormat>();
function formatMonthShort(ymd: string, locale: string): string {
  let formatter = monthFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { month: "short" });
    monthFormatters.set(locale, formatter);
  }
  const [year, month, day] = ymd.split("-").map(Number);
  return formatter.format(new Date(year, month - 1, day));
}

const weekdayFormatters = new Map<string, Intl.DateTimeFormat>();
function formatWeekdayShort(dayIndex: number, locale: string): string {
  let formatter = weekdayFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    weekdayFormatters.set(locale, formatter);
  }
  // 2026-06-14 is a Sunday; add dayIndex to reach the target weekday.
  const base = new Date(2026, 5, 14 + dayIndex);
  return formatter.format(base);
}

export function ActivityHeatmap({ entries }: { entries: InsightsLogEntry[] }) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<HeatmapCell | null>(null);

  const calendar = useMemo(() => buildContributionCalendar(entries), [entries]);

  const monthLabels = useMemo(() => {
    return calendar.weeks.map((week, i) => {
      const firstCell = week[0]!;
      if (i === 0) return formatMonthShort(firstCell.date, locale);
      const [, month] = firstCell.date.split("-").map(Number);
      const [, prevMonth] = calendar.weeks[i - 1]![0]!.date.split("-").map(Number);
      return month !== prevMonth ? formatMonthShort(firstCell.date, locale) : "";
    });
  }, [calendar, locale]);

  const detailText = selected
    ? selected.count > 0
      ? selected.count === 1
        ? t("insights_heatmap_verses_read_one", { count: 1 })
        : t("insights_heatmap_verses_read_other", { count: selected.count })
      : t("insights_heatmap_no_activity")
    : "";

  return (
    <View style={styles.container}>
      <Text variant="caption" color="mutedText">
        {selected ? `${detailText} — ${formatLongDate(selected.date, locale)}` : " "}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View testID="insights.heatmap-grid">
          <View style={styles.monthsRow}>
            <View style={styles.weekdaySpacer} />
            {monthLabels.map((label, i) => (
              <Text key={`m-${i}`} variant="caption" color="mutedText" style={styles.monthLabel}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.body}>
            <View style={styles.weekdayColumn}>
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                <Text
                  key={dayIndex}
                  variant="caption"
                  color="mutedText"
                  style={styles.weekdayLabel}
                >
                  {WEEKDAY_LABEL_OFFSETS.includes(dayIndex)
                    ? formatWeekdayShort(dayIndex, locale)
                    : ""}
                </Text>
              ))}
            </View>
            <View style={styles.grid}>
              {calendar.weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.week}>
                  {week.map((cell) => (
                    <Pressable
                      key={cell.date}
                      testID={`insights.heatmap-cell.${cell.date}`}
                      disabled={cell.future}
                      onPress={() => setSelected(cell)}
                      style={[
                        styles.cell,
                        heatCellStyle(cell.level, cell.future, colors),
                        { borderColor: colors.border },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <Text variant="caption" color="mutedText">
          {t("insights_heatmap_less")}
        </Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.cell,
              heatCellStyle(level, false, colors),
              { borderColor: colors.border },
            ]}
          />
        ))}
        <Text variant="caption" color="mutedText">
          {t("insights_heatmap_more")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  monthsRow: { flexDirection: "row", marginBottom: spacing.xs },
  weekdaySpacer: { width: 28 },
  monthLabel: { width: CELL_SIZE + CELL_GAP },
  body: { flexDirection: "row" },
  weekdayColumn: { width: 28, gap: CELL_GAP, marginRight: spacing.xs },
  weekdayLabel: { height: CELL_SIZE, lineHeight: CELL_SIZE, fontSize: 10 },
  grid: { flexDirection: "row", gap: CELL_GAP },
  week: { gap: CELL_GAP },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    borderWidth: 1,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: CELL_GAP,
    marginTop: spacing.xs,
  },
});
