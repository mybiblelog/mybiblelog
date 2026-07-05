import { type ReactNode, useCallback, useState } from "react";
import type { PassageNote } from "@/src/api/notesApi";
import { useT } from "@/src/i18n/LocaleProvider";
import { notesActions, useNotesQuery } from "@/src/stores/passageNotes";
import { useToast } from "@/src/toast/ToastProvider";
import { ConfirmDialog } from "./ConfirmDialog";
import { MenuSheet } from "./MenuSheet";
import { NoteEditorModal } from "./NoteEditorModal";
import { NotesQuerySheet } from "./NotesQuerySheet";

type NoteOverlaysApi = {
  /** Open the "new note" editor. */
  openAdd: () => void;
  /** Open the card action menu for a note. */
  openMenu: (note: PassageNote) => void;
  /** Open the search/filter/sort sheet. */
  openQuery: () => void;
  /** Render this once at the end of the screen. */
  overlays: ReactNode;
};

/**
 * The add/edit/menu/delete/query overlay cluster for the Notes screen
 * (pattern: `useLogEntryOverlays`). Selection is held as the note object
 * itself; mutations reload the list through the store.
 */
export function useNoteOverlays(): NoteOverlaysApi {
  const t = useT();
  const { showToast } = useToast();
  const query = useNotesQuery();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [menuNote, setMenuNote] = useState<PassageNote | null>(null);
  const [editingNote, setEditingNote] = useState<PassageNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<PassageNote | null>(null);
  const [isQueryOpen, setIsQueryOpen] = useState(false);

  const openAdd = useCallback(() => setIsAddOpen(true), []);
  const openMenu = useCallback((note: PassageNote) => setMenuNote(note), []);
  const openQuery = useCallback(() => setIsQueryOpen(true), []);

  const overlays = (
    <>
      <NoteEditorModal
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(input) => {
          void notesActions.create(input).then((created) => {
            if (!created) showToast({ type: "error", message: t("note_could_not_save") });
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
          });
        }}
      />

      <NotesQuerySheet
        visible={isQueryOpen}
        appliedQuery={query}
        onApply={(update) => {
          void notesActions.applyQuery(update);
        }}
        onClose={() => setIsQueryOpen(false)}
      />
    </>
  );

  return { openAdd, openMenu, openQuery, overlays };
}
