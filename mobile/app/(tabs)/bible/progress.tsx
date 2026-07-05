import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, DatePickerSheet, ProgressBar, Screen, Text } from "@/src/components";
import { spacing } from "@/src/design";
import { formatLongDate, parseYmdToDate } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import {
  getGoalPlan,
  getHistoricalOutlook,
  getRecentOutlook,
  getTodayOutlook,
  getUnreadVerseCount,
  type Outlook,
} from "@/src/progress/outlook";
import { useBibleProgress } from "@/src/stores/bibleProgress";
import { useDateVerseCounts, useDateVerseCountsStore } from "@/src/stores/dateVerseCounts";
import { useLogEntryList } from "@/src/stores/logEntries";
import { useSettingsValue } from "@/src/stores/userSettings";

/** `Date` -> `YYYY-MM-DD` from local components (no timezone shifts). */
function toYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text variant="body" color="mutedText" style={styles.statLabel}>
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.card}>
      <Text variant="label">{title}</Text>
      {description ? (
        <Text variant="caption" color="mutedText" style={styles.cardDescription}>
          {description}
        </Text>
      ) : null}
      <View style={styles.cardBody}>{children}</View>
    </Card>
  );
}

export default function Progress() {
  const t = useT();
  const { locale } = useLocale();
  const entries = useLogEntryList();
  const settings = useSettingsValue();
  const progress = useBibleProgress();
  const dateVerseCounts = useDateVerseCounts();

  const [goalDate, setGoalDate] = useState("");
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);

  // The per-date counts only recompute on entry/settings changes; make sure
  // they exist when landing here directly (web calls this on mount).
  useFocusEffect(
    useCallback(() => {
      void useDateVerseCountsStore.getState().cacheDateVerseCounts();
    }, [])
  );

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const lookBackDate = settings?.lookBackDate ?? "0000-00-00";

  const stats = useMemo(() => {
    const all = entries ?? [];
    return {
      unreadVerses: getUnreadVerseCount(all, lookBackDate),
      historical: getHistoricalOutlook(all, lookBackDate, today),
      thirtyDay: getRecentOutlook(dateVerseCounts, all, lookBackDate, today, 30),
      sevenDay: getRecentOutlook(dateVerseCounts, all, lookBackDate, today, 7),
      todayOutlook: getTodayOutlook(all, lookBackDate, today),
    };
  }, [entries, lookBackDate, today, dateVerseCounts]);

  const goalPlan = goalDate ? getGoalPlan(stats.unreadVerses, today, goalDate) : undefined;

  const formatCount = (n: number) =>
    n.toLocaleString(locale, { maximumFractionDigits: n % 1 === 0 ? 0 : 1 });

  const outlookRows = (outlook: Outlook) => (
    <>
      <StatRow
        label={t("progress_avg_daily_verses")}
        value={formatCount(outlook.averageDailyVerses)}
      />
      <StatRow
        label={t("progress_days_to_finish")}
        value={
          outlook.daysToFinish === null ? t("progress_never") : formatCount(outlook.daysToFinish)
        }
      />
      <StatRow
        label={t("progress_date_to_finish")}
        value={
          outlook.finishDate === null
            ? t("progress_never")
            : formatLongDate(outlook.finishDate, locale)
        }
      />
    </>
  );

  function openGoalDatePicker() {
    const current = (goalDate && parseYmdToDate(goalDate)) || new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "date",
        onChange: (_event, date) => {
          if (date) setGoalDate(toYmd(date));
        },
      });
      return;
    }
    setGoalPickerOpen(true);
  }

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard
          title={t("progress_settings_title")}
          description={t("progress_settings_description")}
        >
          <StatRow
            label={t("progress_look_back_date")}
            value={settings ? formatLongDate(settings.lookBackDate, locale) : "—"}
          />
          <StatRow
            label={t("progress_daily_goal")}
            value={settings ? formatCount(settings.dailyVerseCountGoal) : "—"}
          />
          <Button
            label={t("progress_update_settings")}
            variant="secondary"
            size="sm"
            style={styles.cardAction}
            onPress={() => router.push("/(tabs)/settings/reading")}
          />
        </SectionCard>

        <SectionCard title={t("progress_so_far_title")}>
          {progress ? (
            <>
              <StatRow
                label={t("progress_total_verses")}
                value={formatCount(progress.totalVerses)}
              />
              <StatRow label={t("progress_verses_read")} value={formatCount(progress.versesRead)} />
              <StatRow
                label={t("progress_verses_remaining")}
                value={formatCount(progress.totalVerses - progress.versesRead)}
              />
              <StatRow label={t("progress_percent_complete")} value={`${progress.percentage}%`} />
              <ProgressBar progress={progress.percentage / 100} />
            </>
          ) : null}
        </SectionCard>

        <SectionCard
          title={t("progress_outlook_historical_title")}
          description={t("progress_outlook_historical_description")}
        >
          <StatRow
            label={t("progress_days_since_look_back")}
            value={formatCount(stats.historical.daysSinceLookBack)}
          />
          {outlookRows(stats.historical)}
        </SectionCard>

        <SectionCard
          title={t("progress_outlook_30_title")}
          description={t("progress_outlook_30_description")}
        >
          {outlookRows(stats.thirtyDay)}
        </SectionCard>

        <SectionCard
          title={t("progress_outlook_7_title")}
          description={t("progress_outlook_7_description")}
        >
          {outlookRows(stats.sevenDay)}
        </SectionCard>

        <SectionCard
          title={t("progress_outlook_today_title")}
          description={t("progress_outlook_today_description")}
        >
          <StatRow
            label={t("progress_verses_read")}
            value={formatCount(stats.todayOutlook.newVersesToday)}
          />
          {outlookRows(stats.todayOutlook)}
        </SectionCard>

        <SectionCard title={t("progress_goal_title")} description={t("progress_goal_description")}>
          <View style={styles.statRow}>
            <Text variant="body" color="mutedText" style={styles.statLabel}>
              {t("progress_goal_date")}
            </Text>
            <Button
              label={
                goalDate ? formatLongDate(goalDate, locale) : t("progress_goal_date_placeholder")
              }
              variant="secondary"
              size="sm"
              leftIcon="calendar-outline"
              onPress={openGoalDatePicker}
            />
          </View>
          {goalDate && !goalPlan ? (
            <Text variant="caption" color="destructive" style={styles.goalError}>
              {t("progress_goal_date_error")}
            </Text>
          ) : null}
          <StatRow
            label={t("progress_goal_days")}
            value={goalPlan ? formatCount(goalPlan.days) : "?"}
          />
          <StatRow
            label={t("progress_goal_verses_per_day")}
            value={goalPlan ? formatCount(goalPlan.versesPerDay) : "?"}
          />
        </SectionCard>
      </ScrollView>

      <DatePickerSheet
        visible={goalPickerOpen}
        value={(goalDate && parseYmdToDate(goalDate)) || new Date()}
        onChange={(date) => setGoalDate(toYmd(date))}
        onClose={() => setGoalPickerOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenH,
    paddingBottom: spacing.listBottom,
    gap: spacing.lg,
  },
  card: { gap: 0 },
  cardDescription: { marginTop: spacing.xs },
  cardBody: { marginTop: spacing.md, gap: spacing.md },
  cardAction: { alignSelf: "flex-start" },
  statRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  statLabel: { flexShrink: 1 },
  goalError: { marginTop: -spacing.xs },
});
