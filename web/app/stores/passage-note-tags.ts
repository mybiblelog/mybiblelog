import { defineStore } from 'pinia';
import {
  BrowserCache,
  getTagCreatedMsOrNull,
  normalizeSortOrder,
  sortPassageNoteTags,
  type PassageNoteTag,
  type PassageNoteTagSortOrder,
} from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';

export type { PassageNoteTag, PassageNoteTagSortOrder };

const PASSAGE_NOTE_TAGS_CACHE_KEY = 'passageNoteTags';
const PASSAGE_NOTE_TAGS_CACHE_MINUTES = 10;

export type PassageNoteTagsState = {
  passageNoteTags: PassageNoteTag[];
  sortOrder: PassageNoteTagSortOrder;
  isLoaded: boolean;
};

export const usePassageNoteTagsStore = defineStore('passage-note-tags', {
  state: (): PassageNoteTagsState => ({
    passageNoteTags: [],
    sortOrder: 'label:ascending',
    isLoaded: false,
  }),

  getters: {
    tagCreatedAtMs: () => (tag: PassageNoteTag): number | null => getTagCreatedMsOrNull(tag),
  },

  actions: {
    setPassageNoteTagSortOrder(
      { sortOrder, persist = true }: { sortOrder?: unknown; persist?: boolean } = {},
    ): boolean | Promise<boolean> {
      const normalized = normalizeSortOrder(sortOrder);
      this.sortOrder = normalized;
      sortPassageNoteTags(this.passageNoteTags, this.sortOrder);
      if (!persist) { return true; }
      return useUserSettingsStore().updateSettings({ passageNoteTagSortOrder: normalized });
    },

    setPassageNoteTags(passageNoteTags: unknown): void {
      const next = Array.isArray(passageNoteTags) ? [...(passageNoteTags as PassageNoteTag[])] : [];
      this.passageNoteTags = sortPassageNoteTags(next, this.sortOrder);
    },

    addPassageNoteTag(passageNoteTag: PassageNoteTag): void {
      this.passageNoteTags.push(passageNoteTag);
      sortPassageNoteTags(this.passageNoteTags, this.sortOrder);
    },

    updatePassageNoteTagInState(passageNoteTagUpdate: PassageNoteTag): void {
      const existing = this.passageNoteTags.find(t => t.id === passageNoteTagUpdate.id);
      if (existing) {
        Object.assign(existing, passageNoteTagUpdate);
      }
      else {
        this.passageNoteTags.push(passageNoteTagUpdate);
      }
      sortPassageNoteTags(this.passageNoteTags, this.sortOrder);
    },

    removePassageNoteTag(passageNoteTagId: number | string): void {
      this.passageNoteTags = this.passageNoteTags.filter(t => t.id !== passageNoteTagId);
    },

    async loadPassageNoteTags({ force = false }: { force?: boolean } = {}): Promise<void> {
      if (this.isLoaded && !force) { return; }
      const { $http } = useNuxtApp();
      const sortOrder = useUserSettingsStore().settings.passageNoteTagSortOrder;
      if (sortOrder) {
        this.setPassageNoteTagSortOrder({ sortOrder, persist: false });
      }

      const cachedRaw = BrowserCache.get(PASSAGE_NOTE_TAGS_CACHE_KEY) as unknown;
      let passageNoteTags: PassageNoteTag[] | null = null;
      if (Array.isArray(cachedRaw)) {
        passageNoteTags = cachedRaw as PassageNoteTag[];
      }
      else if (typeof cachedRaw === 'string' && cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw) as unknown;
          if (Array.isArray(parsed)) {
            passageNoteTags = parsed as PassageNoteTag[];
          }
        }
        catch {
          // ignore cache read failures
        }
      }
      if (passageNoteTags) {
        this.setPassageNoteTags(passageNoteTags);
        try {
          BrowserCache.set(
            PASSAGE_NOTE_TAGS_CACHE_KEY,
            JSON.stringify(passageNoteTags),
            PASSAGE_NOTE_TAGS_CACHE_MINUTES,
          );
        }
        catch {
          // ignore cache write failures
        }
      }

      const { data } = await $http.get<PassageNoteTag[]>('/api/passage-note-tags');
      passageNoteTags = data;
      this.setPassageNoteTags(passageNoteTags);
      this.isLoaded = true;
    },

    async createPassageNoteTag(
      { label, color, description }: { label: string; color: string; description: string },
    ): Promise<PassageNoteTag> {
      const { $http } = useNuxtApp();
      const { data: result } = await $http.post<PassageNoteTag>('/api/passage-note-tags', { label, color, description });
      this.addPassageNoteTag(result);
      return result;
    },

    async updatePassageNoteTag(
      { id, label, color, description }: { id: number | string; label: string; color: string; description: string },
    ): Promise<PassageNoteTag | null> {
      const { $http } = useNuxtApp();
      const { data } = await $http.patch<PassageNoteTag | null>(`/api/passage-note-tags/${id}`, { id, label, color, description });
      if (!data) { return null; }
      this.updatePassageNoteTagInState(data);
      return data;
    },

    async deletePassageNoteTag(passageNoteTagId: number | string): Promise<boolean> {
      const { $http } = useNuxtApp();
      const { data } = await $http.delete<unknown>(`/api/passage-note-tags/${passageNoteTagId}`);
      if (data) {
        this.removePassageNoteTag(passageNoteTagId);
        return true;
      }
      return false;
    },
  },
});
