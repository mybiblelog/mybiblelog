import { defineStore } from 'pinia';
import {
  createPassageNote,
  deletePassageNote,
  fetchBookNoteCounts,
  fetchPassageNotesPage,
  updatePassageNote,
  type PassageNote,
  type PassageNoteInput,
  type PassageNotesQuery,
  type UpdatePassageNoteInput,
} from '@mybiblelog/shared';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

export type { PassageNote, PassageNotesQuery };

export type PassageNotesPagination = {
  limit: number;
  page: number;
  size: number;
  totalPages: number;
};

const initialQuery: PassageNotesQuery = {
  limit: 10,
  offset: 0,
  sortOn: 'createdAt',
  sortDirection: 'descending',
  filterTags: [],
  filterTagMatching: 'any',
  searchText: '',
  filterPassageStartVerseId: 0,
  filterPassageEndVerseId: 0,
  filterPassageMatching: 'inclusive',
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// Tag `noteCount` is computed per request by the API and cached in the tags
// store, so any write that changes a note's tag set leaves it stale.
//
// `passageNoteTagsStore` must be resolved by the caller BEFORE its own prior
// await (e.g. right alongside `usePassageNotesStore`'s `this`), never inside
// this helper after an await — on the server, the global active Pinia
// instance can point at a different request's store by the time an await
// resumes, so a bare `usePassageNoteTagsStore()` call here would risk
// mutating another request's store.
const refreshPassageNoteTags = async (
  passageNoteTagsStore: ReturnType<typeof usePassageNoteTagsStore>,
): Promise<void> => {
  // Nothing to invalidate if the tag list was never loaded
  if (!passageNoteTagsStore.isLoaded) { return; }
  await passageNoteTagsStore.loadPassageNoteTags({ force: true });
};

const emptyPagination: PassageNotesPagination = {
  limit: 10,
  page: 1,
  size: 0,
  totalPages: 1,
};

export type PassageNotesState = {
  loading: boolean;
  activePassageNote: PassageNote | null;
  query: PassageNotesQuery;
  passageNotes: PassageNote[];
  pagination: PassageNotesPagination;
  hasLoadedOnce: boolean;
  bookNoteCounts: Record<number, number>;
};

export const usePassageNotesStore = defineStore('passage-notes', {
  state: (): PassageNotesState => ({
    loading: true,
    activePassageNote: null,
    query: clone(initialQuery),
    passageNotes: [],
    pagination: { ...emptyPagination },
    hasLoadedOnce: false,
    bookNoteCounts: {},
  }),
  getters: {
    anyBooksHaveNotes(state): boolean {
      return Object.values(state.bookNoteCounts).some(count => count > 0);
    },
  },
  actions: {
    async loadBookNoteCounts(): Promise<void> {
      const http = useHttp();
      try {
        this.bookNoteCounts = await fetchBookNoteCounts(http);
      }
      catch {
        // Leave bookNoteCounts as-is (an empty map) on error.
      }
    },

    applyQueryUpdate(queryUpdate: Partial<PassageNotesQuery>): void {
      const managedKeys: Array<keyof PassageNotesQuery> = [
        'limit',
        'offset',
        'sortOn',
        'sortDirection',
        'filterTags',
        'filterTagMatching',
        'filterPassageStartVerseId',
        'filterPassageEndVerseId',
        'filterPassageMatching',
        'searchText',
      ];

      for (const param of managedKeys) {
        if (queryUpdate[param] !== undefined) {
          (this.query as Record<string, unknown>)[param] = queryUpdate[param];
        }
      }

      if (Object.keys(queryUpdate).length && queryUpdate.offset === undefined) {
        this.query.offset = 0;
      }
    },

    async resetQuery(queryOverride: Partial<PassageNotesQuery> | null = null): Promise<void> {
      this.query = clone(initialQuery);
      if (queryOverride) {
        this.applyQueryUpdate(queryOverride);
      }
      await this.loadPassageNotesPage();
    },

    async updateQuery(queryUpdate: Partial<PassageNotesQuery>): Promise<void> {
      this.applyQueryUpdate(queryUpdate);
      await this.loadPassageNotesPage();
    },

    async loadPassageNotesPage(): Promise<void> {
      const http = useHttp();
      this.loading = true;
      try {
        const { notes, meta: { offset, limit, size } } = await fetchPassageNotesPage(http, this.query);
        this.passageNotes = notes;
        this.pagination = {
          limit,
          page: Math.floor(offset / limit) + 1,
          size,
          totalPages: Math.max(1, Math.ceil(size / limit)),
        };
        this.hasLoadedOnce = true;
      }
      finally {
        this.loading = false;
      }
    },

    // Notes are a server-sorted/filtered/paginated view (unlike log-entries or
    // passage-note-tags, which hold their full dataset locally), so refreshing
    // in place after a write means reloading the current page rather than
    // optimistically splicing the result into `passageNotes` — a local merge
    // can't reproduce the server's sort position or the page's total count.
    async createPassageNote(newPassageNote: Partial<PassageNoteInput>): Promise<PassageNote> {
      const http = useHttp();
      const passageNoteTagsStore = usePassageNoteTagsStore();
      const created = await createPassageNote(http, newPassageNote);
      await Promise.all([
        this.hasLoadedOnce ? this.loadPassageNotesPage() : Promise.resolve(),
        refreshPassageNoteTags(passageNoteTagsStore),
      ]);
      return created;
    },

    async updatePassageNote(passageNoteUpdate: UpdatePassageNoteInput): Promise<PassageNote> {
      const http = useHttp();
      const passageNoteTagsStore = usePassageNoteTagsStore();
      const updated = await updatePassageNote(http, passageNoteUpdate);
      await Promise.all([
        this.hasLoadedOnce ? this.loadPassageNotesPage() : Promise.resolve(),
        refreshPassageNoteTags(passageNoteTagsStore),
      ]);
      return updated;
    },

    async deletePassageNote(passageNoteId: string): Promise<boolean> {
      const http = useHttp();
      const passageNoteTagsStore = usePassageNoteTagsStore();
      if (await deletePassageNote(http, passageNoteId)) {
        await Promise.all([
          this.loadPassageNotesPage(),
          refreshPassageNoteTags(passageNoteTagsStore),
        ]);
        return true;
      }
      return false;
    },
  },
});
