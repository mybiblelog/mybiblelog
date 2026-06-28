import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Bible } from "@mybiblelog/shared";
import {
  AnimatedList,
  Button,
  ConfirmDialog,
  IconButton,
  LogEntryEditorModal,
  LogEntryMenu,
  LogEntryRow,
  Screen,
  Text,
} from "@/src/components";
import { radius, spacing, useTheme } from "@/src/design";
import { openPassageInBible } from "@/src/bible/openInBible";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useLogEntries } from "@/src/log-entries/LogEntriesProvider";
import { useUserSettings } from "@/src/settings/UserSettingsProvider";
import { useToast } from "@/src/toast/ToastProvider";

// Brand gold for a fully-read day star — a decorative accent outside the
// theme palette.
const GOLD_STAR = "#ffd700";

function parseYmdToDate(ymd: string): Date | null {
  const parts = ymd.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

function formatLongDateLocale(ymd: string, locale: string): string {
  const d = parseYmdToDate(ymd);
  if (!d || Number.isNaN(d.getTime())) return ymd;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function getWeekdayIndex(ymd: string): number {
  const d = parseYmdToDate(ymd);
  if (!d) return 0;
  // JS: Sunday=0 ... Saturday=6 (matches Nuxt's use of weekday() for their Monday-first calc)
  return d.getDay();
}

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

export default function Calendar() {
  const { colors } = useTheme();
  const t = useT();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const { width: windowWidth } = useWindowDimensions();
  const { state: logState, createEntry, updateEntry, deleteEntry } = useLogEntries();
  const { state: settingsState } = useUserSettings();

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs());
  const [selectedDay, setSelectedDay] = useState<string>(today);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  const lookBackDate =
    settingsState.status === "ready" ? settingsState.settings.lookBackDate : "0000-00-00";
  const dailyGoal =
    settingsState.status === "ready" ? settingsState.settings.dailyVerseCountGoal : 0;

  // Month label like Nuxt CalendarDateIndicator.
  const monthLabel = useMemo(() => {
    const jsDate = selectedMonth.toDate();
    const monthName = jsDate.toLocaleString(locale, { month: "long" });
    return `${monthName} ${jsDate.getFullYear()}`;
  }, [locale, selectedMonth]);

  // Build date verse counts for the currently displayed month (Nuxt-style).
  const dateVerseCounts = useMemo(() => {
    if (logState.status !== "ready") return new Map<string, { total: number; unique: number }>();
    if (settingsState.status !== "ready") return new Map<string, { total: number; unique: number }>();

    const firstDay = dayjs(selectedMonth).date(1).format("YYYY-MM-DD");
    const lastDay = dayjs(selectedMonth).date(selectedMonth.daysInMonth()).format("YYYY-MM-DD");

    const entriesFiltered = logState.entries.filter((e) => e.date >= lookBackDate);

    const byDate = new Map<string, Array<{ startVerseId: number; endVerseId: number }>>();
    for (const e of entriesFiltered) {
      const arr = byDate.get(e.date) ?? [];
      arr.push({ startVerseId: e.startVerseId, endVerseId: e.endVerseId });
      byDate.set(e.date, arr);
    }

    const cumulative: Array<{ startVerseId: number; endVerseId: number }> = [];
    const beforeMonth = entriesFiltered.filter((e) => e.date < firstDay);
    for (const e of beforeMonth) {
      cumulative.push({ startVerseId: e.startVerseId, endVerseId: e.endVerseId });
    }
    let totalVersesToDate = Bible.countUniqueRangeVerses(cumulative);

    const map = new Map<string, { total: number; unique: number }>();
    let cursor = dayjs(firstDay);
    const end = dayjs(lastDay);
    while (cursor.format("YYYY-MM-DD") <= end.format("YYYY-MM-DD")) {
      const date = cursor.format("YYYY-MM-DD");
      const dateRanges = byDate.get(date) ?? [];
      const total = Bible.countUniqueRangeVerses(dateRanges);

      cumulative.push(...dateRanges);
      const totalVersesThroughDate = Bible.countUniqueRangeVerses(cumulative);
      const unique = totalVersesThroughDate - totalVersesToDate;
      totalVersesToDate = totalVersesThroughDate;

      map.set(date, { total, unique });
      cursor = cursor.add(1, "day");
    }
    return map;
  }, [logState, lookBackDate, selectedMonth, settingsState.status]);

  type DayCell = {
    date: string;
    isCurrentMonth: boolean;
    uniquePct: number;
    totalPct: number;
  };

  const days = useMemo<DayCell[]>(() => {
    const year = Number(selectedMonth.format("YYYY"));
    const month = Number(selectedMonth.format("M"));
    const numberOfDaysInMonth = selectedMonth.daysInMonth();

    const firstDay = dayjs(selectedMonth).date(1).format("YYYY-MM-DD");
    const firstWeekday = getWeekdayIndex(firstDay);
    const visiblePrev = firstWeekday ? firstWeekday - 1 : 6;

    const lastDay = dayjs(selectedMonth).date(numberOfDaysInMonth).format("YYYY-MM-DD");
    const lastWeekday = getWeekdayIndex(lastDay);
    const visibleNext = lastWeekday ? 7 - lastWeekday : lastWeekday;

    const startGrid = dayjs(firstDay).subtract(visiblePrev, "day");
    const totalCells = visiblePrev + numberOfDaysInMonth + visibleNext;

    const out: DayCell[] = [];
    for (let i = 0; i < totalCells; i++) {
      const date = startGrid.add(i, "day").format("YYYY-MM-DD");
      const isCurrentMonth =
        Number(dayjs(date).format("YYYY")) === year && Number(dayjs(date).format("M")) === month;

      const counts = dateVerseCounts.get(date) ?? { total: 0, unique: 0 };
      const uniquePct = dailyGoal ? (counts.unique / dailyGoal) * 100 : 0;
      const totalPct = dailyGoal ? (counts.total / dailyGoal) * 100 : 0;

      out.push({ date, isCurrentMonth, uniquePct, totalPct });
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

  // When month changes, select first day of that month (Nuxt behavior).
  useEffect(() => {
    const first = dayjs(selectedMonth).date(1).format("YYYY-MM-DD");
    if (dayjs(selectedDay).format("YYYY-MM") !== dayjs(selectedMonth).format("YYYY-MM")) {
      setSelectedDay(first);
    }
  }, [selectedDay, selectedMonth]);

  const entriesForSelectedDay = useMemo(() => {
    if (logState.status !== "ready") return [];
    return logState.entries.filter((e) => e.date === selectedDay);
  }, [logState, selectedDay]);

  // Keep indices valid if list changes (sync/reload).
  useEffect(() => {
    if (menuIndex !== null && !entriesForSelectedDay[menuIndex]) setMenuIndex(null);
    if (editingIndex !== null && !entriesForSelectedDay[editingIndex]) setEditingIndex(null);
    if (confirmDeleteIndex !== null && !entriesForSelectedDay[confirmDeleteIndex]) setConfirmDeleteIndex(null);
  }, [confirmDeleteIndex, editingIndex, entriesForSelectedDay, menuIndex]);

  const verseCountForSelectedDay = useMemo(() => {
    let sum = 0;
    for (const e of entriesForSelectedDay) {
      sum += Bible.countRangeVerses(e.startVerseId, e.endVerseId);
    }
    return sum;
  }, [entriesForSelectedDay]);

  const selectedDayDisplay = useMemo(
    () => formatLongDateLocale(selectedDay, locale),
    [locale, selectedDay]
  );

  return (
    <Screen>
      <AnimatedList
        data={entriesForSelectedDay}
        keyExtractor={(item) =>
          item.clientId ??
          item.id ??
          `${item.date}-${item.startVerseId}-${item.endVerseId}`
        }
        contentContainerStyle={styles.pageContent}
        ItemSeparatorComponent={() => <View style={styles.entrySeparator} />}
        renderItem={({ item, index }) => (
          <LogEntryRow entry={item} onPressMenu={() => setMenuIndex(index)} />
        )}
        ListHeaderComponent={
          <>
            <View style={styles.monthHeader}>
              <Text variant="heading">{monthLabel}</Text>
              <View style={styles.monthNav}>
                <IconButton
                  name="chevron-back"
                  accessibilityLabel={t("calendar_today")}
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
                    const now = dayjs();
                    setSelectedMonth(now);
                    setSelectedDay(today);
                  }}
                />

                <IconButton
                  name="chevron-forward"
                  accessibilityLabel={t("calendar_today")}
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

            <View style={[styles.daysGrid, { paddingHorizontal: dayCellMetrics.horizontalPadding }]}>
              {days.map((d) => {
                const dayNum = dayjs(d.date).format("D");
                const isToday = d.date === today;
                const isSelected = d.date === selectedDay;

                const primaryPct = Math.min(100, d.uniquePct);
                const secondaryPct = Math.min(100, d.totalPct);

                const showGoldStar = d.isCurrentMonth && d.uniquePct >= 100;
                const showBlueStar = !showGoldStar && d.isCurrentMonth && d.totalPct >= 100;

                return (
                  <Pressable
                    key={`${selectedMonth.format("YYYY-MM")}:${d.date}`}
                    disabled={!d.isCurrentMonth}
                    onPress={() => {
                      if (!d.isCurrentMonth) return;
                      setSelectedDay(d.date);
                    }}
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
                        color={
                          isSelected
                            ? "onPrimary"
                            : d.isCurrentMonth
                              ? "text"
                              : "mutedText"
                        }
                      >
                        {dayNum}
                      </Text>
                    </View>

                    {(showGoldStar || showBlueStar) && (
                      <Ionicons
                        name="star"
                        size={16}
                        color={showGoldStar ? GOLD_STAR : colors.secondary}
                        style={styles.dayStar}
                      />
                    )}

                    {d.isCurrentMonth && (
                      <View
                        style={[styles.dayProgressTrack, { backgroundColor: colors.border }]}
                      >
                        <View
                          style={[
                            styles.dayProgressFill,
                            styles.dayProgressFillSecondary,
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
                onPress={() => setIsAddOpen(true)}
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

      <LogEntryEditorModal
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t("add_log_entry_title")}
        submitLabel={t("save")}
        presetDate={selectedDay}
        onSubmit={(entry) => {
          void createEntry({ ...entry, date: selectedDay });
        }}
      />

      <LogEntryEditorModal
        visible={editingIndex !== null && entriesForSelectedDay[editingIndex] !== undefined}
        onClose={() => setEditingIndex(null)}
        title={t("edit_log_entry_title")}
        submitLabel={t("save")}
        initialEntry={editingIndex !== null ? entriesForSelectedDay[editingIndex] : undefined}
        onSubmit={(entry) => {
          if (editingIndex === null) return;
          const existing = entriesForSelectedDay[editingIndex];
          if (!existing?.clientId) return;
          void updateEntry(existing.clientId, entry);
          setEditingIndex(null);
        }}
      />

      <LogEntryMenu
        visible={menuIndex !== null && entriesForSelectedDay[menuIndex] !== undefined}
        onClose={() => setMenuIndex(null)}
        onOpenInBible={() => {
          if (menuIndex === null) return;
          const entry = entriesForSelectedDay[menuIndex];
          if (!entry) return;
          void (async () => {
            const ok = await openPassageInBible(entry.startVerseId, {
              preferredBibleApp: settingsState.status === "ready" ? settingsState.settings.preferredBibleApp : undefined,
              preferredBibleVersion: settingsState.status === "ready" ? settingsState.settings.preferredBibleVersion : undefined,
            });
            if (!ok) {
              showToast({ type: "error", message: t("calendar_open_bible_failed") });
            }
          })();
        }}
        onEdit={() => {
          if (menuIndex === null) return;
          setEditingIndex(menuIndex);
        }}
        onDelete={() => {
          if (menuIndex === null) return;
          setConfirmDeleteIndex(menuIndex);
        }}
      />

      <ConfirmDialog
        visible={confirmDeleteIndex !== null && entriesForSelectedDay[confirmDeleteIndex] !== undefined}
        title={t("delete_confirm_title")}
        message={t("delete_confirm_message")}
        confirmLabel={t("menu_delete")}
        cancelLabel={t("cancel")}
        onCancel={() => setConfirmDeleteIndex(null)}
        onConfirm={() => {
          if (confirmDeleteIndex === null) return;
          const existing = entriesForSelectedDay[confirmDeleteIndex];
          if (existing?.clientId) void deleteEntry(existing.clientId);
          setConfirmDeleteIndex(null);
        }}
      />
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
  dayProgressFillSecondary: {},
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

