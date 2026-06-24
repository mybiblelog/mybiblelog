import type { LogEntry } from "@/src/types/log-entry";
import { ConfirmDialog } from "@/src/components/ConfirmDialog";
import { EmptyState } from "@/src/components/EmptyState";
import { LogEntryEditorModal } from "@/src/components/LogEntryEditorModal";
import { LogEntryMenu } from "@/src/components/LogEntryMenu";
import { LogEntryRow } from "@/src/components/LogEntryRow";
import { Screen } from "@/src/components/Screen";
import { radius, spacing, TOUCH_TARGET, typography } from "@/src/theme/tokens";
import { useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useToast } from "@/src/toast/ToastProvider";
import { openPassageInBible } from "@/src/bible/openInBible";
import { useUserSettings } from "@/src/settings/UserSettingsProvider";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLogEntries } from "@/src/log-entries/LogEntriesProvider";

// const LOG_ENTRIES: LogEntry[] = [
//   { startVerseId: 1001001, endVerseId: 1001005, date: "2026-01-10" },
//   { startVerseId: 1902301, endVerseId: 1902306, date: "2026-01-12" },
//   { startVerseId: 4300101, endVerseId: 4300103, date: "2026-01-15" },
// ];

export default function Log() {
  const t = useT();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { state: settingsState } = useUserSettings();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(
    null
  );

  const { state: logState, createEntry, updateEntry, deleteEntry } = useLogEntries();

  const entries = useMemo(() => {
    if (logState.status !== "ready") return [];
    return logState.entries;
  }, [logState]);

  // Reset selection indices if entries list changes underneath us (e.g. after API reload).
  // Must be declared before any early returns to keep hook order stable.
  useEffect(() => {
    if (menuIndex !== null && !entries[menuIndex]) setMenuIndex(null);
    if (editingIndex !== null && !entries[editingIndex]) setEditingIndex(null);
    if (confirmDeleteIndex !== null && !entries[confirmDeleteIndex]) setConfirmDeleteIndex(null);
  }, [confirmDeleteIndex, editingIndex, entries, menuIndex]);

  if (logState.status !== "ready") {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedText }]}>
          {t("loading_log_entries")}
        </Text>
      </View>
    );
  }

  function openAdd() {
    setIsAddOpen(true);
  }

  function closeAdd() {
    setIsAddOpen(false);
  }

  function closeEdit() {
    setEditingIndex(null);
  }

  function openEntryMenu(index: number) {
    setMenuIndex(index);
  }

  const selectedEntryForEdit: LogEntry | undefined =
    editingIndex !== null ? entries[editingIndex] : undefined;

  const selectedEntryForDelete: LogEntry | undefined =
    confirmDeleteIndex !== null ? entries[confirmDeleteIndex] : undefined;

  return (
    <Screen padded>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t("log_title")}</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={openAdd}
          hitSlop={8}
        >
          <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>
            {t("add")}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={entries}
        contentContainerStyle={[
          styles.listContent,
          entries.length === 0 && styles.listContentEmpty,
        ]}
        keyExtractor={(item) => item.clientId ?? item.id ?? `${item.date}-${item.startVerseId}-${item.endVerseId}`}
        renderItem={({ item, index }) => (
          <LogEntryRow entry={item} onPressMenu={() => openEntryMenu(index)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title={t("empty_title")}
            text={t("empty_text")}
            ctaLabel={t("empty_cta")}
            onPressCta={openAdd}
          />
        }
      />

      <LogEntryEditorModal
        visible={isAddOpen}
        onClose={closeAdd}
        title={t("add_log_entry_title")}
        submitLabel={t("save")}
        onSubmit={(entry) => {
          void createEntry(entry);
        }}
      />

      <LogEntryEditorModal
        visible={editingIndex !== null && selectedEntryForEdit !== undefined}
        onClose={closeEdit}
        title={t("edit_log_entry_title")}
        submitLabel={t("save")}
        initialEntry={selectedEntryForEdit}
        onSubmit={(entry) => {
          if (editingIndex === null) return;
          const existing = entries[editingIndex];
          if (!existing?.clientId) return;
          void updateEntry(existing.clientId, entry);
          setEditingIndex(null);
        }}
      />

      <LogEntryMenu
        visible={menuIndex !== null && entries[menuIndex] !== undefined}
        onClose={() => setMenuIndex(null)}
        onOpenInBible={() => {
          if (menuIndex === null) return;
          const entry = entries[menuIndex];
          if (!entry) return;
          void (async () => {
            const ok = await openPassageInBible(entry.startVerseId, {
              preferredBibleApp: settingsState.status === "ready" ? settingsState.settings.preferredBibleApp : undefined,
              preferredBibleVersion: settingsState.status === "ready" ? settingsState.settings.preferredBibleVersion : undefined,
            });
            if (!ok) {
              showToast({ type: "error", message: "Unable to open Bible app." });
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
        visible={
          confirmDeleteIndex !== null && selectedEntryForDelete !== undefined
        }
        title={t("delete_confirm_title")}
        message={t("delete_confirm_message")}
        confirmLabel={t("menu_delete")}
        cancelLabel={t("cancel")}
        onCancel={() => setConfirmDeleteIndex(null)}
        onConfirm={() => {
          if (confirmDeleteIndex === null) return;
          const existing = entries[confirmDeleteIndex];
          if (existing?.clientId) {
            void deleteEntry(existing.clientId);
          }
          setConfirmDeleteIndex(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    ...typography.screenTitle,
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
  listContent: {
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 14,
  },
});

