import dayjs from "dayjs";
import { router } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  AnimatedList,
  Button,
  DoubleProgressBar,
  EmptyState,
  LogEntryRow,
  ReadingSuggestionsSection,
  ReadingTrackerResetCard,
  RecentNotesSection,
  Screen,
  SkeletonList,
  Text,
  useLogEntryOverlays,
  useSyncRefreshControl,
} from "@/src/components";
import { spacing } from "@/src/design";
import { formatLongDate } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { computeEntryVerseStatsForDate } from "@/src/log-entries/entryStats";
import { formatVerseCountMessage } from "@/src/log-entries/verseCountMessage";
import { useReadingSuggestions } from "@/src/reading-suggestions/useReadingSuggestions";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import { useDateVerseCountsStore } from "@/src/stores/dateVerseCounts";
import { useLogEntryList } from "@/src/stores/logEntries";
import { useSettingsValue } from "@/src/stores/userSettings";
import { Bible } from "@mybiblelog/shared";

const Separator = () => <View style={styles.separator} />;

const percentOf = (value: number, goal: number) => (goal > 0 ? (value / goal) * 100 : 0);

export default function Index() {
  const entries = useLogEntryList();
  const settings = useSettingsValue();
  const t = useT();
  const { locale } = useLocale();
  const refreshControl = useSyncRefreshControl();

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const todayDisplay = useMemo(() => formatLongDate(today, locale), [locale, today]);

  const todayEntries = useMemo(
    () => (entries ?? []).filter((e) => e.date === today),
    [entries, today]
  );

  const { openAdd, openMenu, overlays } = useLogEntryOverlays({
    entries: todayEntries,
    createDate: today,
    updateDate: today,
  });

  const goal = settings?.dailyVerseCountGoal ?? 0;
  const lookBackDate = settings?.lookBackDate ?? "0000-00-00";

  const entryStats = useMemo(
    () => computeEntryVerseStatsForDate(entries ?? [], lookBackDate, today),
    [entries, lookBackDate, today]
  );

  // The daily goal is measured in *new* verses (web parity) — re-reading a
  // passage doesn't advance it. Narrow selectors on purpose: the whole map
  // recomputes on every entry mutation.
  const newVersesReadToday = useDateVerseCountsStore((s) => s.dateVerseCounts[today]?.unique ?? 0);
  const countsPending = useDateVerseCountsStore(
    (s) => s.jobs > 0 && Object.keys(s.dateVerseCounts).length === 0
  );

  const versesReadToday = useMemo(() => {
    const ranges = todayEntries.map((e) => ({
      startVerseId: e.startVerseId,
      endVerseId: e.endVerseId,
    }));
    return Bible.countUniqueRangeVerses(ranges);
  }, [todayEntries]);

  const primaryPercentage = percentOf(newVersesReadToday, goal);
  const secondaryPercentage = percentOf(versesReadToday, goal);

  // Suggestions derive from entries inside the look-back window (web
  // `currentLogEntries` parity).
  const currentEntries = useMemo(
    () => (entries ?? []).filter((e) => e.date >= lookBackDate),
    [entries, lookBackDate]
  );
  const readingSuggestions = useReadingSuggestions(currentEntries, today);

  const loading = entries === null || settings === null;
  // The counts map is empty until the first recompute lands, so the bar would
  // otherwise animate 0 -> N a beat after mount. Web has the same gap.
  const goalPending = loading || countsPending;

  return (
    <Screen padded>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="title">{t("today_title")}</Text>
          {/* Mobile-only: web gets a page title from the browser chrome, a
              phone doesn't, so the date does that orienting work here. */}
          <Text variant="subtitle" color="mutedText" style={styles.subtitle}>
            {todayDisplay}
          </Text>
        </View>
        <Button label={t("add")} testID="today.add-entry" leftIcon="add" onPress={openAdd} />
      </View>

      <View style={styles.goal} testID="daily-goal">
        <DoubleProgressBar
          primaryPercentage={goalPending ? 0 : primaryPercentage}
          secondaryPercentage={goalPending ? 0 : secondaryPercentage}
        />
        <View style={styles.goalMeta}>
          <Text variant="caption" color="mutedText" testID="daily-goal-summary">
            {goalPending
              ? t("loading")
              : goal > 0
                ? t("today_new_verses_read", { read: newVersesReadToday, goal })
                : t("today_no_goal_hint")}
          </Text>
          {!goalPending && goal > 0 ? (
            <Text variant="caption" color="mutedText">
              {`${Math.round(primaryPercentage)}%`}
            </Text>
          ) : null}
        </View>
      </View>

      <ReadingTrackerResetCard hasEntriesToday={todayEntries.length > 0} />

      <AnimatedList
        data={loading ? [] : todayEntries}
        refreshControl={refreshControl}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item: StoredLogEntry) => item.clientId}
        renderItem={({ item }) => {
          const stats = entryStats.get(item.clientId);
          return (
            <LogEntryRow
              entry={item}
              testID="today.entry-row"
              meta={
                stats
                  ? formatVerseCountMessage(t, {
                      count: stats.total,
                      newVerseCount: stats.newSinceLookBack,
                    })
                  : undefined
              }
              onPressMenu={() => openMenu(item)}
            />
          );
        }}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          loading ? (
            <SkeletonList count={3} />
          ) : (
            // Mobile-only: web shows a bare "No Entries" card. A phone can
            // afford the illustration, and the inline CTA saves a reach back
            // up to the header button.
            <EmptyState
              icon="book-outline"
              title={t("today_empty_title")}
              text={t("today_empty_text")}
              ctaLabel={t("add")}
              onPressCta={openAdd}
            />
          )
        }
        ListFooterComponent={
          <>
            <ReadingSuggestionsSection
              suggestions={readingSuggestions}
              today={today}
              loading={loading}
            />
            <View style={styles.viewAll}>
              <Button
                label={t("today_view_all_reading")}
                variant="secondary"
                rightIcon="chevron-forward"
                testID="today.view-all-reading"
                // Mobile has no all-entries list screen; Calendar is the
                // nearest surface for browsing past reading.
                onPress={() => router.push("/(tabs)/calendar")}
              />
            </View>
            <RecentNotesSection />
          </>
        }
      />

      {overlays}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerText: { flex: 1 },
  subtitle: { marginTop: spacing["3xs"] },
  goal: { marginBottom: spacing.xl },
  goalMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  listContent: { paddingBottom: spacing.listBottom },
  separator: { height: spacing.xs },
  viewAll: { alignItems: "center", marginTop: spacing.sm },
});
