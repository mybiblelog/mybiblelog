import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import dayjs from "dayjs";
import {
  buildContributionCalendar,
  type HeatmapCell,
  type HeatmapWeek,
  type InsightsLogEntry,
} from "@mybiblelog/shared";
import { spacing, useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";
import { Text } from "../atoms/Text";
import { formatLongDate } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEKDAY_COLUMN = 28;
// The label gutter width; the months row leaves the same space so month labels
// line up with the grid columns beneath them (weekday column + its right margin).
const LABEL_GUTTER = WEEKDAY_COLUMN + spacing.xs;
const WEEKDAY_LABEL_OFFSETS = [1, 3, 5]; // Mon, Wed, Fri

const HEAT_LEVEL_OPACITY = [0, 0.28, 0.52, 0.76, 1] as const;

// A phone can't show the whole year at a legible cell size, so the range is
// split into two stacked grids of this many months each (most recent on top).
const NARROW_MONTHS = 6;

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

type MonthSegment = { key: string; label: string; year: string; span: number };

// Group consecutive week columns by the month their first day falls in, so each
// month gets a single label spanning its own run of columns (like merged table
// cells). This gives the label its full month's width to sit in — enough room to
// render "Jan" on one line instead of cramming it into a single ~15px column. The
// year renders on a second line so the two stacked grids can't be misread — e.g.
// Dec 2025 above Jan 2026.
function buildMonthSegments(weeks: HeatmapWeek[], locale: string): MonthSegment[] {
  const segments: MonthSegment[] = [];
  let lastMonth = -1;
  for (const week of weeks) {
    const [year, month] = week[0]!.date.split("-").map(Number);
    if (month !== lastMonth) {
      lastMonth = month;
      segments.push({
        key: week[0]!.date,
        label: formatMonthShort(week[0]!.date, locale),
        year: String(year),
        span: 1,
      });
    } else {
      segments[segments.length - 1]!.span += 1;
    }
  }
  return segments;
}

export function ActivityHeatmap({ entries }: { entries: InsightsLogEntry[] }) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<HeatmapCell | null>(null);

  const calendar = useMemo(() => buildContributionCalendar(entries), [entries]);

  // Split the year into two stacked half-year grids so the cells stay legible
  // and fill the width without horizontal scrolling (recent months on top).
  const strips = useMemo(() => {
    const weeks = calendar.weeks;
    const cutoff = dayjs().subtract(NARROW_MONTHS, "month").format("YYYY-MM-DD");
    const idx = weeks.findIndex((week) => week[week.length - 1]!.date >= cutoff);
    const splitAt = idx <= 0 ? 0 : idx;
    const recent = splitAt > 0 ? weeks.slice(splitAt) : weeks;
    const previous = weeks.slice(0, splitAt);
    return [
      { name: "recent", weeks: recent },
      { name: "previous", weeks: previous },
    ]
      .filter((strip) => strip.weeks.length > 0)
      .map((strip) => ({ ...strip, monthSegments: buildMonthSegments(strip.weeks, locale) }));
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
        {selected ? `${detailText} — ${formatLongDate(selected.date, locale)}` : " "}
      </Text>

      {strips.map((strip, stripIndex) => (
        <View
          key={strip.name}
          // Cap the width so cells never grow past their natural size on wide
          // screens; below the cap the columns shrink fluidly to fit.
          style={[
            {
              maxWidth: LABEL_GUTTER + strip.weeks.length * (CELL_SIZE + CELL_GAP),
            },
            stripIndex > 0 && styles.stripGap,
          ]}
          testID={stripIndex === 0 ? "insights.heatmap-grid" : undefined}
        >
          <View style={styles.monthsRow}>
            <View style={styles.weekdaySpacer} />
            {strip.monthSegments.map((segment) => (
              <View key={segment.key} style={[styles.monthLabel, { flexGrow: segment.span }]}>
                <Text variant="caption" color="mutedText" numberOfLines={1}>
                  {segment.label}
                </Text>
                <Text
                  variant="caption"
                  color="mutedText"
                  numberOfLines={1}
                  style={styles.monthYear}
                >
                  {segment.year}
                </Text>
              </View>
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
              {strip.weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.week}>
                  {week.map((cell) => (
                    <Pressable
                      key={cell.date}
                      testID={`insights.heatmap-cell.${cell.date}`}
                      disabled={cell.future}
                      onPress={() => setSelected(cell)}
                      style={[
                        styles.gridCell,
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
      ))}

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
  stripGap: { marginTop: spacing.lg },
  monthsRow: { flexDirection: "row", marginBottom: spacing.xs },
  weekdaySpacer: { width: LABEL_GUTTER },
  // flexGrow is set per segment (= its month's column span); basis 0 keeps the
  // widths proportional so each label lines up over its own run of columns.
  monthLabel: { flexBasis: 0, minWidth: 0 },
  monthYear: { fontSize: 9, opacity: 0.75 },
  body: { flexDirection: "row" },
  weekdayColumn: { width: WEEKDAY_COLUMN, gap: CELL_GAP, marginRight: spacing.xs },
  weekdayLabel: { height: CELL_SIZE, lineHeight: CELL_SIZE, fontSize: 10 },
  grid: { flex: 1, flexDirection: "row", gap: CELL_GAP },
  week: { flex: 1, minWidth: 0, gap: CELL_GAP },
  // Fluid cell: fills its week column's width so the strip spans the container.
  gridCell: {
    height: CELL_SIZE,
    borderRadius: 2,
    borderWidth: 1,
  },
  // Fixed-size swatch for the legend (not part of the fluid grid).
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
