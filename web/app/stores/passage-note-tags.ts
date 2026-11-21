import { defineStore } from 'pinia';
import {
  createPassageNoteTag,
  deletePassageNoteTag,
  fetchPassageNoteTags,
  getTagCreatedMsOrNull,
  normalizeSortOrder,
  sortPassageNoteTags,
  updatePassageNoteTag,
  type PassageNoteTag,
  type PassageNoteTagInput,
  type PassageNoteTagSortOrder,
  type UpdatePassageNoteTagInput,
} from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';

export type { PassageNoteTag, PassageNoteTagSortOrder };

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
      this.passageNoteTags = sortPassageNoteTags(this.passageNoteTags, this.sortOrder);
      if (!persist) { return true; }
      return useUserSettingsStore().updateSettings({ passageNoteTagSortOrder: normalized });
    },

    setPassageNoteTags(passageNoteTags: PassageNoteTag[]): void {
      this.passageNoteTags = sortPassageNoteTags(passageNoteTags, this.sortOrder);
    },

    addPassageNoteTag(passageNoteTag: PassageNoteTag): void {
      this.passageNoteTags = sortPassageNoteTags([...this.passageNoteTags, passageNoteTag], this.sortOrder);
    },

    updatePassageNoteTagInState(passageNoteTagUpdate: PassageNoteTag): void {
      const existing = this.passageNoteTags.find(t => t.id === passageNoteTagUpdate.id);
      if (existing) {
        Object.assign(existing, passageNoteTagUpdate);
      }
      else {
        this.passageNoteTags.push(passageNoteTagUpdate);
      }
      this.passageNoteTags = sortPassageNoteTags(this.passageNoteTags, this.sortOrder);
    },

    removePassageNoteTag(passageNoteTagId: string): void {
      this.passageNoteTags = this.passageNoteTags.filter(t => t.id !== passageNoteTagId);
    },

    async loadPassageNoteTags({ force = false }: { force?: boolean } = {}): Promise<void> {
      if (this.isLoaded && !force) { return; }
      const http = useHttp();
      const sortOrder = useUserSettingsStore().settings.passageNoteTagSortOrder;
      if (sortOrder) {
        this.setPassageNoteTagSortOrder({ sortOrder, persist: false });
      }

      this.setPassageNoteTags(await fetchPassageNoteTags(http));
      this.isLoaded = true;
    },

    async createPassageNoteTag(input: PassageNoteTagInput): Promise<PassageNoteTag> {
      const created = await createPassageNoteTag(useHttp(), input);
      this.addPassageNoteTag(created);
      return created;
    },

    async updatePassageNoteTag(input: UpdatePassageNoteTagInput): Promise<PassageNoteTag> {
      const updated = await updatePassageNoteTag(useHttp(), input);
      this.updatePassageNoteTagInState(updated);
      return updated;
    },

    async deletePassageNoteTag(passageNoteTagId: string): Promise<boolean> {
      if (await deletePassageNoteTag(useHttp(), passageNoteTagId)) {
        this.removePassageNoteTag(passageNoteTagId);
        return true;
      }
      return false;
    },
  },
});
