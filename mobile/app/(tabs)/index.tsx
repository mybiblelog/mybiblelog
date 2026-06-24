import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import type { LogEntry } from "@/src/types/log-entry";
import { ConfirmDialog } from "@/src/components/ConfirmDialog";
import { EmptyState } from "@/src/components/EmptyState";
import { LogEntryEditorModal } from "@/src/components/LogEntryEditorModal";
import { LogEntryMenu } from "@/src/components/LogEntryMenu";
import { LogEntryRow } from "@/src/components/LogEntryRow";
import { Screen } from "@/src/components/Screen";
import { radius, spacing, TOUCH_TARGET, typography } from "@/src/theme/tokens";
import { useLogEntries } from "@/src/log-entries/LogEntriesProvider";
import { useUserSettings } from "@/src/settings/UserSettingsProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { openPassageInBible } from "@/src/bible/openInBible";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useToast } from "@/src/toast/ToastProvider";
import { Bible } from "@mybiblelog/shared";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

function formatLongDateLocale(date: string, locale: string): string {
  const parts = date.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return date;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function entryKey(e: LogEntry): string {
  return e.clientId ?? e.id ?? `${e.date}-${e.startVerseId}-${e.endVerseId}`;
}

export default function Index() {
  const { colors } = useTheme();
  const { state: logState, createEntry, updateEntry, deleteEntry } = useLogEntries();
  const { state: settingsState } = useUserSettings();
  const { showToast } = useToast();
  const t = useT();
  const { locale } = useLocale();

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const todayDisplay = useMemo(() => formatLongDateLocale(today, locale), [locale, today]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  const todayEntries = useMemo(() => {
    if (logState.status !== "ready") return [];
    return logState.entries.filter((e) => e.date === today);
  }, [logState, today]);

  // Keep indices valid if list changes (sync/reload).
  useEffect(() => {
    if (menuIndex !== null && !todayEntries[menuIndex]) setMenuIndex(null);
    if (editingIndex !== null && !todayEntries[editingIndex]) setEditingIndex(null);
    if (confirmDeleteIndex !== null && !todayEntries[confirmDeleteIndex]) setConfirmDeleteIndex(null);
  }, [confirmDeleteIndex, editingIndex, menuIndex, todayEntries]);

  const goal =
    settingsState.status === "ready"
      ? settingsState.settings.dailyVerseCountGoal
      : 0;
  const lookBackDate =
    settingsState.status === "ready" ? settingsState.settings.lookBackDate : "0000-00-00";

  const perEntryVerseStats = useMemo(() => {
    if (logState.status !== "ready") return new Map<string, { total: number; newSinceLookBack: number }>();
    if (settingsState.status !== "ready") return new Map<string, { total: number; newSinceLookBack: number }>();

    const all = logState.entries.slice();

    // Sort chronologically so "new verses" matches Nuxt's cumulative delta behavior.
    all.sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      // deterministic tie-breaker for same date
      if (a.startVerseId !== b.startVerseId) return a.startVerseId - b.startVerseId;
      return a.endVerseId - b.endVerseId;
    });

    const map = new Map<string, { total: number; newSinceLookBack: number }>();

    const cumulative: Array<{ startVerseId: number; endVerseId: number }> = [];
    let totalVersesToDate = 0;

    for (const e of all) {
      const key = entryKey(e);
      const total = Bible.countRangeVerses(e.startVerseId, e.endVerseId);

      if (e.date < lookBackDate) {
        map.set(key, { total, newSinceLookBack: 0 });
        continue;
      }

      // Like Nuxt `date-verse-counts`: uniqueAfter - uniqueBefore is the incremental "new verses".
      cumulative.push({ startVerseId: e.startVerseId, endVerseId: e.endVerseId });
      const totalVersesThroughDate = Bible.countUniqueRangeVerses(cumulative);
      const newSinceLookBack = totalVersesThroughDate - totalVersesToDate;
      totalVersesToDate = totalVersesThroughDate;

      map.set(key, { total, newSinceLookBack });
    }

    return map;
  }, [logState, lookBackDate, settingsState.status]);

  const versesReadToday = useMemo(() => {
    const ranges = todayEntries.map((e) => ({
      startVerseId: e.startVerseId,
      endVerseId: e.endVerseId,
    }));
    return Bible.countUniqueRangeVerses(ranges);
  }, [todayEntries]);

  const progress = goal > 0 ? Math.min(1, versesReadToday / goal) : 0;
  const progressPct = Math.round(progress * 100);

  if (logState.status !== "ready" || settingsState.status !== "ready") {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Screen padded>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t("today_title")}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            {todayDisplay}
          </Text>
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setIsAddOpen(true)}
          hitSlop={8}
        >
          <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>{t("add")}</Text>
        </Pressable>
      </View>

      <View style={[styles.progressCard, { backgroundColor: colors.surfaceAlt }]}>
        <View style={styles.progressTopRow}>
          <Text style={[styles.progressLabel, { color: colors.text }]}>
            {t("today_daily_goal")}
          </Text>
          <Text style={[styles.progressMeta, { color: colors.mutedText }]}>
            {goal > 0 ?
              t("today_progress_meta_with_goal", {
                pct: progressPct,
                read: versesReadToday,
                goal,
                verses: t("verses_lowercase"),
              }) :
              t("today_progress_meta_no_goal", {
                read: versesReadToday,
                verses: t("verses_lowercase"),
              })}
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progressPct}%` },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={todayEntries}
        contentContainerStyle={[
          styles.listContent,
          todayEntries.length === 0 && styles.listContentEmpty,
        ]}
        keyExtractor={(item) => item.clientId ?? item.id ?? `${item.date}-${item.startVerseId}-${item.endVerseId}`}
        renderItem={({ item, index }) => (
          <LogEntryRow
            entry={item}
            meta={(() => {
              const stats = perEntryVerseStats.get(entryKey(item));
              if (!stats) return undefined;
              return t("today_entry_meta", {
                new: stats.newSinceLookBack,
                total: stats.total,
              });
            })()}
            onPressMenu={() => setMenuIndex(index)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title={t("today_empty_title")}
            text={t("today_empty_text")}
            ctaLabel={t("add")}
            onPressCta={() => setIsAddOpen(true)}
          />
        }
      />

      <LogEntryEditorModal
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t("add_log_entry_title")}
        submitLabel={t("save")}
        onSubmit={(entry) => {
          void createEntry({ ...entry, date: today });
        }}
      />

      <LogEntryEditorModal
        visible={editingIndex !== null && todayEntries[editingIndex] !== undefined}
        onClose={() => setEditingIndex(null)}
        title={t("edit_log_entry_title")}
        submitLabel={t("save")}
        initialEntry={editingIndex !== null ? todayEntries[editingIndex] : undefined}
        onSubmit={(entry) => {
          if (editingIndex === null) return;
          const existing = todayEntries[editingIndex];
          if (!existing?.clientId) return;
          void updateEntry(existing.clientId, { ...entry, date: today });
          setEditingIndex(null);
        }}
      />

      <LogEntryMenu
        visible={menuIndex !== null && todayEntries[menuIndex] !== undefined}
        onClose={() => setMenuIndex(null)}
        onOpenInBible={() => {
          if (menuIndex === null) return;
          const entry = todayEntries[menuIndex];
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
        visible={confirmDeleteIndex !== null && todayEntries[confirmDeleteIndex] !== undefined}
        title={t("delete_confirm_title")}
        message={t("delete_confirm_message")}
        confirmLabel={t("menu_delete")}
        cancelLabel={t("cancel")}
        onCancel={() => setConfirmDeleteIndex(null)}
        onConfirm={() => {
          if (confirmDeleteIndex === null) return;
          const existing = todayEntries[confirmDeleteIndex];
          if (existing?.clientId) void deleteEntry(existing.clientId);
          setConfirmDeleteIndex(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.screenTitle,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  addButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    ...typography.buttonLabel,
  },
  progressCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  progressTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "900",
  },
  progressMeta: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  listContent: {
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

