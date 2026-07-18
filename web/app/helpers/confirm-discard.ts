import { useDialogStore } from '~/stores/dialog';

/**
 * The single canonical "confirm before discarding unsaved changes" gate.
 *
 * Returns `true` when it is safe to proceed with closing/discarding — either
 * because there are no unsaved changes, or because the user confirmed the
 * discard. Returns `false` only when the user cancels the confirm dialog.
 *
 * Both the editor stores' `closeEditor` (via `createEditorStore`) and the
 * feedback modal route through this so the discard UX stays consistent.
 */
export function confirmDiscardIfDirty(
  isDirty: boolean,
  confirmMessage?: string,
): Promise<boolean> {
  if (!isDirty) {
    return Promise.resolve(true);
  }
  const message = confirmMessage || 'Are you sure you want to close without saving?';
  return useDialogStore().confirm({ message });
}
