import { type ReactNode, useCallback, useState } from "react";
import { Bible } from "@mybiblelog/shared";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import { openPassageInBible } from "@/src/bible/openInBible";
import { useT } from "@/src/i18n/LocaleProvider";
import { logEntryActions } from "@/src/stores/logEntries";
import { useSettingsValue } from "@/src/stores/userSettings";
import { useToast } from "@/src/toast/ToastProvider";
import { ConfirmDialog } from "./ConfirmDialog";
import { LogEntryEditorModal } from "./LogEntryEditorModal";
import { LogEntryMenu } from "./LogEntryMenu";

type Options = {
  /** The entries the overlays act on (usually the screen's visible list). */
  entries: StoredLogEntry[];
  /** Date preset shown in the add editor (defaults to today inside the editor). */
  presetDate?: string;
  /** When set, force this date onto newly created entries (Today / Calendar). */
  createDate?: string;
  /** When set, force this date onto edited entries (Today). */
  updateDate?: string;
};

type LogEntryOverlaysApi = {
  /** Open the "add entry" editor. */
  openAdd: () => void;
  /** Open the row action menu for an entry. */
  openMenu: (entry: StoredLogEntry) => void;
  /** Render this once at the end of the screen. */
  overlays: ReactNode;
};

/**
 * The add/edit/menu/delete overlay cluster shared by the Today, Log and
 * Calendar screens: two `LogEntryEditorModal`s, the row `LogEntryMenu`, and
 * the delete `ConfirmDialog`, wired to the log-entries store.
 *
 * Selection is tracked by `clientId` and resolved against `entries` on each
 * render, so when a background sync replaces the list the selection simply
 * stops resolving and the overlay closes itself — no index bookkeeping.
 */
export function useLogEntryOverlays({
  entries,
  presetDate,
  createDate,
  updateDate,
}: Options): LogEntryOverlaysApi {
  const t = useT();
  const { showToast } = useToast();
  const settings = useSettingsValue();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [menuClientId, setMenuClientId] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const findEntry = (clientId: string | null) =>
    clientId === null ? undefined : entries.find((e) => e.clientId === clientId);

  const menuEntry = findEntry(menuClientId);
  const editingEntry = findEntry(editingClientId);
  const deletingEntry = findEntry(deletingClientId);

  const openAdd = useCallback(() => setIsAddOpen(true), []);
  const openMenu = useCallback((entry: StoredLogEntry) => setMenuClientId(entry.clientId), []);

  const openInBible = (startVerseId: number, endVerseId: number) => {
    void (async () => {
      const ok = await openPassageInBible(startVerseId, endVerseId, {
        preferredBibleApp: settings?.preferredBibleApp,
        preferredBibleVersion: settings?.preferredBibleVersion,
      });
      if (!ok) {
        showToast({ type: "error", message: t("calendar_open_bible_failed") });
      }
    })();
  };

  const handleOpenInBible = () => {
    if (!menuEntry) return;
    openInBible(menuEntry.startVerseId, menuEntry.endVerseId);
  };

  // Continue reading from the verse after this entry's end, through the end of
  // that chapter (matches web `today.vue`). Only offered when a next verse
  // exists (i.e. not the final verse of Revelation).
  const nextVerseId = menuEntry ? Bible.getNextVerseId(menuEntry.endVerseId, true) : 0;
  const handleContinueReading = () => {
    if (!nextVerseId) return;
    const { book, chapter } = Bible.parseVerseId(nextVerseId);
    openInBible(nextVerseId, Bible.getLastBookChapterVerseId(book, chapter));
  };

  const overlays = (
    <>
      <LogEntryEditorModal
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t("add_log_entry_title")}
        submitLabel={t("save")}
        presetDate={presetDate}
        onSubmit={(entry) => {
          void logEntryActions.createEntry(createDate ? { ...entry, date: createDate } : entry);
        }}
      />

      <LogEntryEditorModal
        visible={editingEntry !== undefined}
        onClose={() => setEditingClientId(null)}
        title={t("edit_log_entry_title")}
        submitLabel={t("save")}
        initialEntry={editingEntry}
        onSubmit={(entry) => {
          if (!editingEntry) return;
          void logEntryActions.updateEntry(
            editingEntry.clientId,
            updateDate ? { ...entry, date: updateDate } : entry
          );
          setEditingClientId(null);
        }}
      />

      <LogEntryMenu
        visible={menuEntry !== undefined}
        onClose={() => setMenuClientId(null)}
        onOpenInBible={handleOpenInBible}
        onContinueReading={nextVerseId ? handleContinueReading : undefined}
        onEdit={() => setEditingClientId(menuClientId)}
        onDelete={() => setDeletingClientId(menuClientId)}
      />

      <ConfirmDialog
        visible={deletingEntry !== undefined}
        title={t("delete_confirm_title")}
        message={t("delete_confirm_message")}
        confirmLabel={t("menu_delete")}
        cancelLabel={t("cancel")}
        onCancel={() => setDeletingClientId(null)}
        onConfirm={() => {
          if (deletingEntry) void logEntryActions.deleteEntry(deletingEntry.clientId);
          setDeletingClientId(null);
        }}
      />
    </>
  );

  return { openAdd, openMenu, overlays };
}
