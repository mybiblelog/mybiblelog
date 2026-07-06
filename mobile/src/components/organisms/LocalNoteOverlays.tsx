import { type ReactNode, useCallback, useState } from "react";
import type { NoteInput, PassageNote } from "@/src/api/notesApi";
import { useT } from "@/src/i18n/LocaleProvider";
import { offlineNoteActions } from "@/src/stores/offlineNotes";
import { useToast } from "@/src/toast/ToastProvider";
import { ConfirmDialog } from "./ConfirmDialog";
import { MenuSheet } from "./MenuSheet";
import { NoteEditorModal } from "./NoteEditorModal";

type LocalNoteOverlaysApi = {
  /** Open the "new note" editor. */
  openAdd: () => void;
  /** Open the card action menu for a local note. */
  openMenu: (note: PassageNote) => void;
  /** Render this once at the end of the screen. */
  overlays: ReactNode;
};

const toInput = (input: NoteInput & { id?: string }): NoteInput => ({
  content: input.content,
  passages: input.passages,
  tags: input.tags,
});

/**
 * Offline sibling of `useNoteOverlays`: the add/edit/menu/delete cluster for the
 * local-notes surface. Reuses the same (network-agnostic) editor/menu/confirm
 * components, but writes through `offlineNoteActions` keyed by `clientId` (carried
 * as the mapped note's `id`). No search/filter/sort here.
 */
export function useLocalNoteOverlays(): LocalNoteOverlaysApi {
  const t = useT();
  const { showToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [menuNote, setMenuNote] = useState<PassageNote | null>(null);
  const [editingNote, setEditingNote] = useState<PassageNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<PassageNote | null>(null);

  const openAdd = useCallback(() => setIsAddOpen(true), []);
  const openMenu = useCallback((note: PassageNote) => setMenuNote(note), []);

  const overlays = (
    <>
      <NoteEditorModal
        visible={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(input) => {
          void offlineNoteActions.createNote(toInput(input)).then((created) => {
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
          void offlineNoteActions.updateNote(editingNote.id, toInput(input)).then((saved) => {
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
          void offlineNoteActions.deleteNote(note.id).then((deleted) => {
            if (!deleted) showToast({ type: "error", message: t("note_could_not_delete") });
          });
        }}
      />
    </>
  );

  return { openAdd, openMenu, overlays };
}
