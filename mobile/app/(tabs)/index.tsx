import dayjs from "dayjs";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  AnimatedList,
  Button,
  Card,
  EmptyState,
  LogEntryRow,
  ProgressBar,
  ReadingSuggestionsSection,
  RecentNotesSection,
  Screen,
  Spinner,
  Text,
  useLogEntryOverlays,
  useSyncRefreshControl,
} from "@/src/components";
import { spacing } from "@/src/design";
import { formatLongDate } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { computeEntryVerseStatsForDate } from "@/src/log-entries/entryStats";
import { useReadingSuggestions } from "@/src/reading-suggestions/useReadingSuggestions";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import { useLogEntryList } from "@/src/stores/logEntries";
import { useSettingsValue } from "@/src/stores/userSettings";
import { Bible } from "@mybiblelog/shared";

const Separator = () => <View style={styles.separator} />;

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

  const versesReadToday = useMemo(() => {
    const ranges = todayEntries.map((e) => ({
      startVerseId: e.startVerseId,
      endVerseId: e.endVerseId,
    }));
    return Bible.countUniqueRangeVerses(ranges);
  }, [todayEntries]);

  const progress = goal > 0 ? Math.min(1, versesReadToday / goal) : 0;
  const progressPct = Math.round(progress * 100);

  // Suggestions derive from entries inside the look-back window (web
  // `currentLogEntries` parity).
  const currentEntries = useMemo(
    () => (entries ?? []).filter((e) => e.date >= lookBackDate),
    [entries, lookBackDate]
  );
  const readingSuggestions = useReadingSuggestions(currentEntries, today);

  if (entries === null || settings === null) {
    return (
      <Screen>
        <Spinner center />
      </Screen>
    );
  }

  return (
    <Screen padded>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="title">{t("today_title")}</Text>
          <Text variant="subtitle" color="mutedText" style={styles.subtitle}>
            {todayDisplay}
          </Text>
        </View>
        <Button label={t("add")} testID="today.add-entry" leftIcon="add" onPress={openAdd} />
      </View>

      <Card style={styles.progressCard}>
        <View style={styles.progressTopRow}>
          <Text variant="label">{t("today_daily_goal")}</Text>
          <Text variant="caption" color="mutedText">
            {goal > 0
              ? t("today_progress_meta_with_goal", {
                  pct: progressPct,
                  read: versesReadToday,
                  goal,
                  verses: t("verses_lowercase"),
                })
              : t("today_progress_meta_no_goal", {
                  read: versesReadToday,
                  verses: t("verses_lowercase"),
                })}
          </Text>
        </View>
        {goal > 0 ? (
          <ProgressBar progress={progress} />
        ) : (
          <Text variant="caption" color="mutedText">
            {t("today_no_goal_hint")}
          </Text>
        )}
      </Card>

      <AnimatedList
        data={todayEntries}
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
                  ? t("today_entry_meta", { new: stats.newSinceLookBack, total: stats.total })
                  : undefined
              }
              onPressMenu={() => openMenu(item)}
            />
          );
        }}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title={t("today_empty_title")}
            text={t("today_empty_text")}
            ctaLabel={t("add")}
            onPressCta={openAdd}
          />
        }
        ListFooterComponent={
          <>
            <ReadingSuggestionsSection suggestions={readingSuggestions} today={today} />
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
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerText: { flex: 1 },
  subtitle: { marginTop: 2 },
  progressCard: {
    marginBottom: spacing.xl,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.listBottom,
  },
  separator: {
    height: spacing.md,
  },
});
