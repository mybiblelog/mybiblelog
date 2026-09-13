import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { usePassageNoteTagEditorStore } from '~/stores/passage-note-tag-editor';

/*
 * The note/log/tag editors are global modals whose open state lives in a
 * Pinia store, decoupled from the URL. A browser back navigation (including
 * a mobile swipe-back gesture) changes the route without ever touching that
 * store, so the modal used to stay open on top of whatever page the
 * navigation landed on. Routing every navigation through each editor's
 * existing `closeEditor()` reuses its dirty-check + confirm-discard prompt
 * (the same one the close button already triggers) and lets us cancel the
 * navigation if the user backs out of the prompt.
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) { return; }
  if (to.fullPath === from.fullPath) { return; }

  const stores = [
    usePassageNoteEditorStore(),
    useLogEntryEditorStore(),
    usePassageNoteTagEditorStore(),
  ];

  for (const store of stores) {
    if (store.open) {
      const proceed = await store.closeEditor();
      if (!proceed) {
        return abortNavigation();
      }
    }
  }
});
