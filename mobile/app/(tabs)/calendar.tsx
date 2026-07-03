import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Bible } from "@mybiblelog/shared";
import {
  AnimatedList,
  Button,
  IconButton,
  LogEntryRow,
  Screen,
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
  const t = useT();
  const { locale } = useLocale();
  const { width: windowWidth } = useWindowDimensions();
  const entries = useLogEntryList();
  const settings = useSettingsValue();
  const refreshControl = useSyncRefreshControl();

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs());
  const [selectedDay, setSelectedDay] = useState<string>(today);

  const dailyGoal = settings?.dailyVerseCountGoal ?? 0;

  // Month label like Nuxt CalendarDateIndicator.
  const monthLabel = useMemo(() => {
    const jsDate = selectedMonth.toDate();
    const monthName = jsDate.toLocaleString(locale, { month: "long" });
    return `${monthName} ${jsDate.getFullYear()}`;
  }, [locale, selectedMonth]);

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

  const dayCellMetrics = useMemo(() => {
    const horizontalPadding = 16;
    const gap = 1;
    const available = windowWidth - horizontalPadding * 2;
    const cellWidth = Math.floor((available - gap * 6) / 7);
    return { horizontalPadding, gap, cellWidth };
  }, [windowWidth]);

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
        renderItem={({ item }) => <LogEntryRow entry={item} onPressMenu={() => openMenu(item)} />}
        ListHeaderComponent={
          <>
            <View style={styles.monthHeader}>
              <Text variant="heading">{monthLabel}</Text>
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
            </View>

            <View style={styles.weekdaysRow}>
              {weekdayLabels.map((w) => (
                <View key={w} style={[styles.weekdayCell, { width: dayCellMetrics.cellWidth }]}>
                  <Text variant="caption" color="mutedText">
                    {w}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[styles.daysGrid, { paddingHorizontal: dayCellMetrics.horizontalPadding }]}
            >
              {days.map((d) => {
                const isToday = d.date === today;
                const isSelected = d.date === selectedDay;

                const primaryPct = Math.min(100, d.uniquePct);
                const secondaryPct = Math.min(100, d.totalPct);

                const showGoldStar = d.isCurrentMonth && d.uniquePct >= 100;
                const showBlueStar = !showGoldStar && d.isCurrentMonth && d.totalPct >= 100;

                return (
                  <Pressable
                    key={d.date}
                    disabled={!d.isCurrentMonth}
                    accessibilityRole="button"
                    accessibilityLabel={formatLongDate(d.date, locale)}
                    accessibilityState={{ selected: isSelected, disabled: !d.isCurrentMonth }}
                    onPress={() => setSelectedDay(d.date)}
                    style={[
                      styles.dayCell,
                      {
                        width: dayCellMetrics.cellWidth,
                        height: Math.max(70, Math.floor(dayCellMetrics.cellWidth)),
                        marginRight: dayCellMetrics.gap,
                        marginBottom: dayCellMetrics.gap,
                        backgroundColor: d.isCurrentMonth ? colors.surface : colors.surfaceAlt,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dayNumberCircle,
                        isToday && { backgroundColor: colors.border },
                        isSelected && { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        variant="label"
                        color={isSelected ? "onPrimary" : d.isCurrentMonth ? "text" : "mutedText"}
                      >
                        {d.dayNumber}
                      </Text>
                    </View>

                    {(showGoldStar || showBlueStar) && (
                      <Ionicons
                        name="star"
                        size={16}
                        color={showGoldStar ? colors.starGold : colors.secondary}
                        style={styles.dayStar}
                      />
                    )}

                    {d.isCurrentMonth && (
                      <View style={[styles.dayProgressTrack, { backgroundColor: colors.border }]}>
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
  entrySeparator: { height: spacing.md },
  monthHeader: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.screenH,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  weekdaysRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.xs,
  },
  weekdayCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: spacing.md,
  },
  dayCell: {
    position: "relative",
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xs,
  },
  dayNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dayStar: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  dayProgressTrack: {
    position: "absolute",
    left: 2,
    right: 2,
    bottom: 2,
    height: 5,
    borderRadius: 3,
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
    marginHorizontal: spacing.screenH,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  entryHeaderText: { flex: 1 },
  entryVerseCount: {
    marginTop: 2,
  },
  addButton: {
    borderRadius: radius.md,
  },
  emptyWrap: { paddingVertical: spacing.xl },
  noEntries: {
    textAlign: "center",
  },
});
