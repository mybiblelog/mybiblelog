import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { PassageNote } from "@/src/api/notesApi";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { useRecentNotes } from "@/src/notes/useRecentNotes";
import { notesActions } from "@/src/stores/passageNotes";
import { useToast } from "@/src/toast/ToastProvider";
import { Button } from "../atoms/Button";
import { Spinner } from "../atoms/Spinner";
import { Text } from "../atoms/Text";
import { ConfirmDialog } from "./ConfirmDialog";
import { MenuSheet } from "./MenuSheet";
import { NoteCard } from "./NoteCard";
import { NoteEditorModal } from "./NoteEditorModal";

/**
 * The Today screen's "Recent Notes" section (web `today.vue` equivalent):
 * the three most recently created notes with add/edit/delete actions and a
 * link to the Notes tab. Uses its own lightweight fetch (`useRecentNotes`)
 * so the Notes tab's query state is never disturbed; mutations go through
 * `notesActions` (keeping the notes store and note counts coherent) and then
 * refresh the local list.
 */
export function RecentNotesSection() {
  const t = useT();
  const { showToast } = useToast();
  const { status, notes, refresh } = useRecentNotes();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [menuNote, setMenuNote] = useState<PassageNote | null>(null);
  const [editingNote, setEditingNote] = useState<PassageNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<PassageNote | null>(null);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="label" style={styles.headerTitle}>
          {t("today_recent_notes")}
        </Text>
        <Button
          label={t("notes_new")}
          variant="secondary"
          size="sm"
          leftIcon="add"
          onPress={() => setIsAddOpen(true)}
        />
      </View>

      {status === "loading" && notes.length === 0 ? (
        <Spinner />
      ) : notes.length === 0 ? (
        <Text variant="body" color="mutedText">
          {t("today_no_recent_notes")}
        </Text>
      ) : (
        <View style={styles.list}>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onPressMenu={setMenuNote} />
          ))}
        </View>
      )}

      <Button
        label={t("notes_view_all")}
        variant="ghost"
        onPress={() => router.push("/(tabs)/notes")}
        style={styles.viewAll}
      />

      <NoteEditorModal
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(input) => {
          void notesActions.create(input).then((created) => {
            if (!created) showToast({ type: "error", message: t("note_could_not_save") });
            else refresh();
          });
        }}
      />

      <NoteEditorModal
        visible={editingNote !== null}
        initialNote={editingNote}
        onClose={() => setEditingNote(null)}
        onSubmit={(input) => {
          if (!editingNote) return;
          void notesActions.update({ ...input, id: editingNote.id }).then((saved) => {
            if (!saved) showToast({ type: "error", message: t("note_could_not_save") });
            else refresh();
          });
          setEditingNote(null);
        }}
      />

      <MenuSheet
        visible={menuNote !== null}
        onClose={() => setMenuNote(null)}
        cancelLabel={t("cancel")}
        actions={[
          { label: t("edit"), onPress: () => setEditingNote(menuNote) },
          {
            label: t("delete"),
            color: "destructive",
            onPress: () => setDeletingNote(menuNote),
          },
        ]}
      />

      <ConfirmDialog
        visible={deletingNote !== null}
        title={t("note_delete_confirm_title")}
        message={t("note_delete_confirm_message")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onCancel={() => setDeletingNote(null)}
        onConfirm={() => {
          const note = deletingNote;
          setDeletingNote(null);
          if (!note) return;
          void notesActions.remove(note.id).then((deleted) => {
            if (!deleted) showToast({ type: "error", message: t("note_could_not_delete") });
            else refresh();
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerTitle: { flex: 1 },
  list: { gap: spacing.md },
  viewAll: { marginTop: spacing.md },
});
