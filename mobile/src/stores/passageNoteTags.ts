import { create } from "zustand";
import { toApiErrorCode } from "@/src/api/apiError";
import {
  type PassageNoteTag,
  type TagInput,
  createTag,
  deleteTag,
  fetchTags,
  updateTag,
} from "@/src/api/tagsApi";
import {
  type PassageNoteTagSortOrder,
  normalizeSortOrder,
  sortPassageNoteTags,
} from "@/src/notes/tagSort";
import { reportHandledError } from "@/src/observability/sentry";
import { userSettingsActions, useUserSettingsStore } from "@/src/stores/userSettings";

/**
 * Passage-note-tags store (Zustand).
 *
 * Mirrors `web/app/stores/passage-note-tags.ts`: the tag list is kept sorted
 * client-side by the user's persisted sort order (a server-backed user
 * setting). Loaded lazily from the Notes/Tags screens' mount effects, not
 * `init.ts`. Unlike the web store, `create` returns the created tag so callers
 * can auto-select it directly (no baseline diffing).
 */

export type TagsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; tags: PassageNoteTag[] }
  | { status: "error"; code: string };

type TagsStore = {
  state: TagsState;
  sortOrder: PassageNoteTagSortOrder;
  loadTags: () => Promise<void>;
  setSortOrder: (order: PassageNoteTagSortOrder, options?: { persist?: boolean }) => Promise<void>;
  create: (input: TagInput) => Promise<PassageNoteTag | null>;
  update: (input: TagInput & { id: string }) => Promise<PassageNoteTag | null>;
  remove: (id: string) => Promise<boolean>;
};

function getPersistedSortOrder(): PassageNoteTagSortOrder | null {
  const settings = useUserSettingsStore.getState().state;
  if (settings.status !== "ready") return null;
  const stored = settings.settings.passageNoteTagSortOrder;
  return stored ? normalizeSortOrder(stored) : null;
}

let loadInFlight: Promise<void> | null = null;

export const useTagsStore = create<TagsStore>((set, get) => ({
  state: { status: "idle" },
  sortOrder: "label:ascending",

  async loadTags() {
    if (loadInFlight) return loadInFlight;

    loadInFlight = (async () => {
      const current = get().state;
      if (current.status === "idle" || current.status === "error") {
        set({ state: { status: "loading" } });
      }
      const sortOrder = getPersistedSortOrder() ?? get().sortOrder;
      set({ sortOrder });
      try {
        const tags = await fetchTags();
        set({ state: { status: "ready", tags: sortPassageNoteTags(tags, get().sortOrder) } });
      } catch (err) {
        reportHandledError(err, { op: "passageNoteTags.loadTags" });
        // Keep an already-loaded list on refresh failures.
        if (get().state.status !== "ready") {
          set({ state: { status: "error", code: toApiErrorCode(err) } });
        }
      } finally {
        loadInFlight = null;
      }
    })();

    return loadInFlight;
  },

  async setSortOrder(order, { persist = true } = {}) {
    const normalized = normalizeSortOrder(order);
    const current = get().state;
    set({
      sortOrder: normalized,
      ...(current.status === "ready"
        ? {
            state: {
              status: "ready" as const,
              tags: sortPassageNoteTags(current.tags, normalized),
            },
          }
        : {}),
    });
    if (persist) {
      await userSettingsActions.setLocalSettings({ passageNoteTagSortOrder: normalized });
      await userSettingsActions.updateServerSettings({ passageNoteTagSortOrder: normalized });
    }
  },

  async create(input) {
    try {
      const created = await createTag(input);
      const current = get().state;
      if (current.status === "ready") {
        set({
          state: {
            status: "ready",
            tags: sortPassageNoteTags([...current.tags, created], get().sortOrder),
          },
        });
      }
      return created;
    } catch (err) {
      reportHandledError(err, { op: "passageNoteTags.create" });
      return null;
    }
  },

  async update(input) {
    try {
      const saved = await updateTag(input);
      const current = get().state;
      if (current.status === "ready") {
        set({
          state: {
            status: "ready",
            tags: sortPassageNoteTags(
              // The update response omits noteCount (parsed as 0); editing a
              // tag can't change how many notes use it, so keep the known count.
              current.tags.map((t) =>
                t.id === saved.id ? { ...t, ...saved, noteCount: t.noteCount } : t
              ),
              get().sortOrder
            ),
          },
        });
      }
      return saved;
    } catch (err) {
      reportHandledError(err, { op: "passageNoteTags.update" });
      return null;
    }
  },

  async remove(id) {
    try {
      const deleted = await deleteTag(id);
      const current = get().state;
      if (deleted && current.status === "ready") {
        set({ state: { status: "ready", tags: current.tags.filter((t) => t.id !== id) } });
      }
      return deleted;
    } catch (err) {
      reportHandledError(err, { op: "passageNoteTags.remove" });
      return false;
    }
  },
}));

export function useTagsState(): TagsState {
  return useTagsStore((s) => s.state);
}

const EMPTY_TAGS: PassageNoteTag[] = [];

/** The sorted tag list, or an empty array until loaded. */
export function useTagsList(): PassageNoteTag[] {
  return useTagsStore((s) => (s.state.status === "ready" ? s.state.tags : EMPTY_TAGS));
}

export function useTagsSortOrder(): PassageNoteTagSortOrder {
  return useTagsStore((s) => s.sortOrder);
}

/**
 * Store actions, stable for the lifetime of the app — safe to use directly in
 * event handlers without subscribing the component to any store state.
 */
export const tagActions = {
  loadTags: () => useTagsStore.getState().loadTags(),
  setSortOrder: (order: PassageNoteTagSortOrder, options?: { persist?: boolean }) =>
    useTagsStore.getState().setSortOrder(order, options),
  create: (input: TagInput) => useTagsStore.getState().create(input),
  update: (input: TagInput & { id: string }) => useTagsStore.getState().update(input),
  remove: (id: string) => useTagsStore.getState().remove(id),
};
