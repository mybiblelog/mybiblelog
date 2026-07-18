import { create } from "zustand";

/**
 * Just-opened store (Zustand).
 *
 * Mirrors `web/app/stores/just-opened.ts`: after the user opens a passage in
 * their external Bible app, this holds the passage range so the global
 * `JustOpenedModal` (rendered at the root layout) can prompt them to log that
 * reading when they return to the app. The prompt is ephemeral and not
 * persisted. It is raised by `openPassageInBible` on a successful open.
 */

type JustOpenedState = {
  open: boolean;
  startVerseId: number | null;
  endVerseId: number | null;
};

export const useJustOpenedStore = create<JustOpenedState>(() => ({
  open: false,
  startVerseId: null,
  endVerseId: null,
}));

export function useJustOpened(): JustOpenedState {
  return useJustOpenedStore();
}

/**
 * Store actions, stable for the lifetime of the app — safe to call directly
 * from event handlers and non-React code (e.g. `openPassageInBible`) without
 * subscribing to any store state.
 */
export const justOpenedActions = {
  openPrompt: (startVerseId: number, endVerseId: number): void =>
    useJustOpenedStore.setState({ open: true, startVerseId, endVerseId }),
  dismiss: (): void =>
    useJustOpenedStore.setState({ open: false, startVerseId: null, endVerseId: null }),
};
