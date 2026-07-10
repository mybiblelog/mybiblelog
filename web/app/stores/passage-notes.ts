import { defineStore } from 'pinia';
import type { PassageNotesQuery } from '~/helpers/passage-notes-route-query';

export type { PassageNotesQuery };

export type PassageNoteListItem = {
  id: number | string;
  createdAt?: string;
  updatedAt?: string;
  passages?: Array<{ startVerseId: number; endVerseId: number }>;
  tags?: Array<number | string>;
  content?: string;
  [key: string]: unknown;
};

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

const emptyPagination: PassageNotesPagination = {
  limit: 10,
  page: 1,
  size: 0,
  totalPages: 1,
};

export type PassageNotesState = {
  loading: boolean;
  activePassageNote: PassageNoteListItem | null;
  query: PassageNotesQuery;
  passageNotes: PassageNoteListItem[];
  pagination: PassageNotesPagination;
  hasLoadedOnce: boolean;
};

type ApiMetaPagination = {
  offset?: number;
  limit?: number;
  size?: number;
};

const buildQueryString = (query: PassageNotesQuery): string => {
  const params = new URLSearchParams();

  if (Array.isArray(query.filterTags) && query.filterTags.length) {
    for (const filterTag of query.filterTags) {
      params.append('filterTags', `${filterTag}`);
    }
  }
  if (query.searchText) {
    params.set('searchText', query.searchText);
  }
  if (query.filterTagMatching) {
    params.set('filterTagMatching', query.filterTagMatching);
  }
  if (query.filterPassageStartVerseId && query.filterPassageEndVerseId) {
    params.set('filterPassageStartVerseId', `${query.filterPassageStartVerseId}`);
    params.set('filterPassageEndVerseId', `${query.filterPassageEndVerseId}`);
    if (query.filterPassageMatching) {
      params.set('filterPassageMatching', query.filterPassageMatching);
    }
  }
  if (query.sortOn) {
    params.set('sortOn', query.sortOn);
  }
  if (query.sortDirection) {
    params.set('sortDirection', query.sortDirection);
  }
  if (query.limit) {
    params.set('limit', `${query.limit}`);
  }
  if (query.offset) {
    params.set('offset', `${query.offset}`);
  }

  const out = params.toString();
  return out ? `?${out}` : '';
};

export const usePassageNotesStore = defineStore('passage-notes', {
  state: (): PassageNotesState => ({
    loading: true,
    activePassageNote: null,
    query: clone(initialQuery),
    passageNotes: [],
    pagination: { ...emptyPagination },
    hasLoadedOnce: false,
  }),
  actions: {
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
      const { $http } = useNuxtApp();
      this.loading = true;
      try {
        const search = buildQueryString(this.query);
        const result = await $http.get<PassageNoteListItem[]>(`/api/passage-notes${search}`);
        const results = result.data;
        const meta = result.meta;

        const pagination = (meta as { pagination?: ApiMetaPagination } | undefined)?.pagination || {};
        const offset = Number(pagination.offset || 0);
        const limit = Number(pagination.limit || this.query.limit || 10);
        const size = Number(pagination.size || 0);

        this.passageNotes = Array.isArray(results) ? results : [];
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

    async createPassageNote(newPassageNote: Record<string, unknown>): Promise<PassageNoteListItem | null> {
      const { $http } = useNuxtApp();
      const { data } = await $http.post<PassageNoteListItem>('/api/passage-notes', newPassageNote);
      return data || null;
    },

    async updatePassageNote(passageNoteUpdate: Record<string, unknown> & { id: number | string }): Promise<PassageNoteListItem | null> {
      const { $http } = useNuxtApp();
      const { id } = passageNoteUpdate;
      const { data } = await $http.patch<PassageNoteListItem>(`/api/passage-notes/${id}`, passageNoteUpdate);
      return data || null;
    },

    async deletePassageNote(passageNoteId: number | string): Promise<boolean> {
      const { $http } = useNuxtApp();
      const { data } = await $http.delete<unknown>(`/api/passage-notes/${passageNoteId}`);
      if (data) {
        await this.loadPassageNotesPage();
        return true;
      }
      return false;
    },
  },
});
