import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Bible } from "@mybiblelog/shared";
import {
  AnimatedList,
  Button,
  IconButton,
  LogEntryRow,
  Screen,
  ScreenHeader,
  Text,
  useLogEntryOverlays,
  useSyncRefreshControl,
} from "@/src/components";
import { radius, spacing, useTheme } from "@/src/design";
import { formatLongDate, getWeekdayIndex } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import { useLogEntryList } from "@/src/stores/logEntries";
import { useSettingsValue } from "@/src/stores/userSettings";
import { useDateVerseCounts } from "@/src/stores/dateVerseCounts";

function getWeekdayLabels(locale: string): string[] {
  const options: Intl.DateTimeFormatOptions = { weekday: "short" };
  return [
    new Date(2000, 1, 7).toLocaleDateString(locale, options), // Monday
    new Date(2000, 1, 1).toLocaleDateString(locale, options), // Tuesday
    new Date(2000, 1, 2).toLocaleDateString(locale, options), // Wednesday
    new Date(2000, 1, 3).toLocaleDateString(locale, options), // Thursday
    new Date(2000, 1, 4).toLocaleDateString(locale, options), // Friday
    new Date(2000, 1, 5).toLocaleDateString(locale, options), // Saturday
    new Date(2000, 1, 6).toLocaleDateString(locale, options), // Sunday
  ];
}

/** Gap between cells — real spacing now that cells carry their own shape
 * (background + rounded corners) instead of a painted border line. */
const GRID_GAP = spacing["2xs"];

/** Every cell is rounded by this much on every corner... */
const CELL_RADIUS_BASE = radius.sm;
/** ...except the one corner facing the grid's outer edge on each of the 4
 * corner cells, which takes this larger radius so the whole month reads as
 * an extra-rounded block rather than four small rounded squares. */
const CELL_RADIUS_OUTER = radius.xl;

type DayCell = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  uniquePct: number;
  totalPct: number;
};

const EntrySeparator = () => <View style={styles.entrySeparator} />;

export default function Calendar() {
  const { colors } = useTheme();
  // Light's `surface` is defined identical to `background` (both flatten onto
  // one white canvas), so a cell filled with `surface` has no contrast against
  // the page and its rounded shape disappears. Dark's `surface` already lifts
  // above `background`, so this only changes anything in light.
  const cellBg = colors.surface === colors.background ? colors.surfaceMuted : colors.surface;
  const adjacentCellBg =
    colors.surface === colors.background ? colors.surfaceSubtle : colors.surfaceMuted;
  const t = useT();
  const { locale } = useLocale();
  const entries = useLogEntryList();
  const settings = useSettingsValue();
  const refreshControl = useSyncRefreshControl();

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs());
  const [selectedDay, setSelectedDay] = useState<string>(today);

  const dailyGoal = settings?.dailyVerseCountGoal ?? 0;

  // Month/year split so the header can stack year above month name (see
  // ScreenHeader's `eyebrow`) instead of truncating long localized month names.
  const monthName = useMemo(
    () => selectedMonth.toDate().toLocaleString(locale, { month: "long" }),
    [locale, selectedMonth]
  );
  const yearLabel = useMemo(() => String(selectedMonth.year()), [selectedMonth]);

  // Per-date verse counts come from the dateVerseCounts store, which computes
  // the full map (earliest entry → today) via shared `computeDateVerseCounts`
  // and recomputes when entries or the look-back date change. `total` is the
  // day's unique verses; `unique` is the day's contribution to cumulative unique
  // verses since the tracker start (lookBackDate).
  const dateVerseCounts = useDateVerseCounts();

  const days = useMemo<DayCell[]>(() => {
    // Monday-first grid. Cells are derived arithmetically from the index —
    // only the leading day of the grid needs date math.
    const numberOfDaysInMonth = selectedMonth.daysInMonth();
    const firstDay = selectedMonth.date(1);
    const firstWeekday = getWeekdayIndex(firstDay.format("YYYY-MM-DD"));
    const visiblePrev = firstWeekday ? firstWeekday - 1 : 6;

    const lastWeekday = getWeekdayIndex(
      selectedMonth.date(numberOfDaysInMonth).format("YYYY-MM-DD")
    );
    const visibleNext = lastWeekday ? 7 - lastWeekday : lastWeekday;

    const startGrid = firstDay.subtract(visiblePrev, "day");
    const totalCells = visiblePrev + numberOfDaysInMonth + visibleNext;

    const out: DayCell[] = [];
    let cursor = startGrid;
    for (let i = 0; i < totalCells; i++) {
      const date = cursor.format("YYYY-MM-DD");
      const isCurrentMonth = i >= visiblePrev && i < visiblePrev + numberOfDaysInMonth;

      const counts = dateVerseCounts[date] ?? { total: 0, unique: 0 };
      const uniquePct = dailyGoal ? (counts.unique / dailyGoal) * 100 : 0;
      const totalPct = dailyGoal ? (counts.total / dailyGoal) * 100 : 0;

      out.push({ date, dayNumber: cursor.date(), isCurrentMonth, uniquePct, totalPct });
      cursor = cursor.add(1, "day");
    }
    return out;
  }, [dailyGoal, dateVerseCounts, selectedMonth]);

  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);

  const weeks = useMemo<DayCell[][]>(() => {
    const out: DayCell[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  const entriesForSelectedDay = useMemo(
    () => (entries ?? []).filter((e) => e.date === selectedDay),
    [entries, selectedDay]
  );

  const { openAdd, openMenu, overlays } = useLogEntryOverlays({
    entries: entriesForSelectedDay,
    presetDate: selectedDay,
    createDate: selectedDay,
  });

  const verseCountForSelectedDay = useMemo(() => {
    let sum = 0;
    for (const e of entriesForSelectedDay) {
      sum += Bible.countRangeVerses(e.startVerseId, e.endVerseId);
    }
    return sum;
  }, [entriesForSelectedDay]);

  const selectedDayDisplay = useMemo(
    () => formatLongDate(selectedDay, locale),
    [locale, selectedDay]
  );

  return (
    <Screen>
      <AnimatedList
        data={entriesForSelectedDay}
        refreshControl={refreshControl}
        keyExtractor={(item: StoredLogEntry) => item.clientId}
        contentContainerStyle={styles.pageContent}
        ItemSeparatorComponent={EntrySeparator}
        renderItem={({ item }) => (
          <View style={styles.rowWrap}>
            <LogEntryRow entry={item} onPressMenu={() => openMenu(item)} />
          </View>
        )}
        ListHeaderComponent={
          <>
            {/* The month is what this screen is about, so it *is* the screen
                title rather than a section heading above one. */}
            <ScreenHeader
              padded
              eyebrow={yearLabel}
              title={monthName}
              style={styles.monthHeader}
              right={
                <View style={styles.monthNav}>
                  <IconButton
                    name="chevron-back"
                    accessibilityLabel={t("calendar_prev_month")}
                    onPress={() => {
                      const next = dayjs(selectedMonth).subtract(1, "month");
                      setSelectedMonth(next);
                      setSelectedDay(next.date(1).format("YYYY-MM-DD"));
                    }}
                  />

                  <Button
                    label={t("calendar_today")}
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setSelectedMonth(dayjs());
                      setSelectedDay(today);
                    }}
                  />

                  <IconButton
                    name="chevron-forward"
                    accessibilityLabel={t("calendar_next_month")}
                    onPress={() => {
                      const next = dayjs(selectedMonth).add(1, "month");
                      setSelectedMonth(next);
                      setSelectedDay(next.date(1).format("YYYY-MM-DD"));
                    }}
                  />
                </View>
              }
            />

            <View testID="calendar.weekdays-row" style={styles.weekdaysRow}>
              {weekdayLabels.map((w) => (
                <View key={w} style={styles.weekdayCell}>
                  <Text variant="caption" color="mutedText">
                    {w}
                  </Text>
                </View>
              ))}
            </View>

            <View testID="calendar.days-grid" style={styles.daysGrid}>
              {weeks.map((week, weekIndex) => (
                <View key={week[0].date} testID="calendar.week-row" style={styles.weekRow}>
                  {week.map((d, dayIndex) => {
                    const isTopRow = weekIndex === 0;
                    const isBottomRow = weekIndex === weeks.length - 1;
                    const isFirstColumn = dayIndex === 0;
                    const isLastColumn = dayIndex === week.length - 1;

                    const isToday = d.date === today;
                    const isSelected = d.date === selectedDay;

                    const primaryPct = Math.min(100, d.uniquePct);
                    const secondaryPct = Math.min(100, d.totalPct);

                    const showGoldStar = d.isCurrentMonth && d.uniquePct >= 100;
                    const showBlueStar = !showGoldStar && d.isCurrentMonth && d.totalPct >= 100;

                    return (
                      <Pressable
                        key={d.date}
                        testID={`calendar.day-cell.${d.date}`}
                        disabled={!d.isCurrentMonth}
                        accessibilityRole="button"
                        accessibilityLabel={formatLongDate(d.date, locale)}
                        accessibilityState={{ selected: isSelected, disabled: !d.isCurrentMonth }}
                        onPress={() => setSelectedDay(d.date)}
                        style={[
                          styles.dayCell,
                          {
                            backgroundColor: d.isCurrentMonth ? cellBg : adjacentCellBg,
                            borderTopLeftRadius:
                              isTopRow && isFirstColumn ? CELL_RADIUS_OUTER : CELL_RADIUS_BASE,
                            borderTopRightRadius:
                              isTopRow && isLastColumn ? CELL_RADIUS_OUTER : CELL_RADIUS_BASE,
                            borderBottomLeftRadius:
                              isBottomRow && isFirstColumn ? CELL_RADIUS_OUTER : CELL_RADIUS_BASE,
                            borderBottomRightRadius:
                              isBottomRow && isLastColumn ? CELL_RADIUS_OUTER : CELL_RADIUS_BASE,
                          },
                        ]}
                      >
                        <View style={styles.dayCellContent}>
                          <View
                            style={[
                              styles.dayNumberCircle,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : isToday
                                    ? colors.border
                                    : "transparent",
                              },
                            ]}
                          >
                            <Text
                              variant="label"
                              color={
                                isSelected ? "onPrimary" : d.isCurrentMonth ? "text" : "mutedText"
                              }
                            >
                              {d.dayNumber}
                            </Text>
                          </View>

                          <View style={styles.dayStarSlot}>
                            {(showGoldStar || showBlueStar) && (
                              <Ionicons
                                name="star"
                                size={16}
                                color={showGoldStar ? colors.starGold : colors.secondary}
                              />
                            )}
                          </View>
                        </View>

                        {d.isCurrentMonth && (
                          <View
                            style={[styles.dayProgressTrack, { backgroundColor: colors.border }]}
                          >
                            <View
                              style={[
                                styles.dayProgressFill,
                                { width: `${secondaryPct}%`, backgroundColor: colors.secondary },
                              ]}
                            />
                            <View
                              style={[
                                styles.dayProgressFill,
                                { width: `${primaryPct}%`, backgroundColor: colors.primary },
                              ]}
                            />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={[styles.entryHeader, { borderBottomColor: colors.primary }]}>
              <View style={styles.entryHeaderText}>
                <Text variant="bodyStrong">{selectedDayDisplay}</Text>
                <Text variant="caption" color="mutedText" style={styles.entryVerseCount}>
                  {verseCountForSelectedDay} {t("calendar_verses")}
                </Text>
              </View>
              <IconButton
                name="add"
                accessibilityLabel={t("add_log_entry_title")}
                color="onPrimary"
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={openAdd}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text variant="body" color="mutedText" style={styles.noEntries}>
              {t("calendar_no_entries")}
            </Text>
          </View>
        }
      />

      {overlays}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingBottom: spacing.listBottom,
  },
  entrySeparator: { height: spacing.sm },
  rowWrap: { paddingHorizontal: spacing.pageGutter },
  monthHeader: { paddingBottom: spacing.sm },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing["2xs"],
  },
  // Column geometry is mirrored from daysGrid/weekRow below so the labels stay
  // centred over their columns.
  weekdaysRow: {
    flexDirection: "row",
    marginHorizontal: spacing.pageGutter,
    paddingHorizontal: GRID_GAP,
    gap: GRID_GAP,
    paddingBottom: spacing["2xs"],
  },
  weekdayCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  daysGrid: {
    marginHorizontal: spacing.pageGutter,
    marginBottom: spacing.sm,
    gap: GRID_GAP,
  },
  weekRow: {
    flexDirection: "row",
    gap: GRID_GAP,
  },
  dayCell: {
    position: "relative",
    flex: 1,
    minWidth: 0,
    minHeight: 70,
    padding: spacing["2xs"],
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dayStarSlot: {
    height: 16,
    marginTop: spacing["3xs"],
    alignItems: "center",
    justifyContent: "center",
  },
  dayProgressTrack: {
    position: "absolute",
    left: 2,
    right: 2,
    bottom: 2,
    height: 5,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  dayProgressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  entryHeader: {
    borderBottomWidth: 2,
    marginHorizontal: spacing.pageGutter,
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  entryHeaderText: { flex: 1 },
  entryVerseCount: {
    marginTop: spacing["3xs"],
  },
  addButton: {
    borderRadius: radius.pill,
  },
  emptyWrap: { paddingVertical: spacing.md },
  noEntries: {
    textAlign: "center",
  },
});
