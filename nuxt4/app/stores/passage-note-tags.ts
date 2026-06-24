import { defineStore } from 'pinia';
import { BrowserCache } from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';

const PASSAGE_NOTE_TAGS_CACHE_KEY = 'passageNoteTags';
const PASSAGE_NOTE_TAGS_CACHE_MINUTES = 10;

const TagSortOrders = [
  'label:ascending',
  'createdAt:descending',
  'createdAt:ascending',
  'noteCount:descending',
  'noteCount:ascending',
  'color:hue',
] as const;

export type PassageNoteTagSortOrder = typeof TagSortOrders[number];

export type PassageNoteTag = {
  id: number | string;
  _id?: string;
  label?: string;
  color?: string;
  description?: string;
  noteCount?: number;
  createdAt?: string;
  [key: string]: unknown;
};

export type PassageNoteTagsState = {
  passageNoteTags: PassageNoteTag[];
  sortOrder: PassageNoteTagSortOrder;
};

type Http = {
  get: <T>(path: string) => Promise<{ data: T }>;
  post: <T>(path: string, body?: unknown) => Promise<{ data: T }>;
  put: <T>(path: string, body?: unknown) => Promise<{ data: T }>;
  delete: <T>(path: string) => Promise<{ data: T }>;
};

const passageNoteTagLabelCollator = new Intl.Collator(undefined, {
  usage: 'sort',
  sensitivity: 'base',
  numeric: true,
});

const getPassageNoteTagSortKey = (label: unknown): string => {
  return String(label ?? '')
    .trimStart()
    .replace(/^[^\p{L}\p{N}]+/u, '');
};

const compareByLabelAsc = (a: PassageNoteTag, b: PassageNoteTag): number => {
  const aKey = getPassageNoteTagSortKey(a?.label);
  const bKey = getPassageNoteTagSortKey(b?.label);
  const byKey = passageNoteTagLabelCollator.compare(aKey, bKey);
  if (byKey) { return byKey; }

  const byFullLabel = passageNoteTagLabelCollator.compare(String(a?.label ?? ''), String(b?.label ?? ''));
  if (byFullLabel) { return byFullLabel; }

  return passageNoteTagLabelCollator.compare(String(a?.id ?? ''), String(b?.id ?? ''));
};

const getDateMsOrNull = (value: unknown): number | null => {
  const ms = Date.parse(String(value ?? ''));
  return Number.isFinite(ms) ? ms : null;
};

const getObjectIdCreatedMsOrNull = (id: unknown): number | null => {
  const hex = String(id ?? '').trim();
  if (!/^[0-9a-f]{24}$/i.test(hex)) { return null; }
  const seconds = parseInt(hex.slice(0, 8), 16);
  if (!Number.isFinite(seconds)) { return null; }
  return seconds * 1000;
};

const getTagCreatedMsOrNull = (tag: PassageNoteTag | null | undefined): number | null => {
  return getDateMsOrNull(tag?.createdAt) ??
    getObjectIdCreatedMsOrNull(tag?.id) ??
    getObjectIdCreatedMsOrNull(tag?._id);
};

const normalizeHexColor = (hex: unknown): string | null => {
  const raw = String(hex ?? '').trim().toLowerCase();
  if (!raw) { return null; }
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (/^#[0-9a-f]{3}$/i.test(withHash)) {
    const r = withHash[1];
    const g = withHash[2];
    const b = withHash[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(withHash)) {
    return withHash;
  }
  return null;
};

const hexToRgb = (hex: unknown): { r: number; g: number; b: number } | null => {
  const normalized = normalizeHexColor(hex);
  if (!normalized) { return null; }
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  if (![r, g, b].every(Number.isFinite)) { return null; }
  return { r, g, b };
};

const rgbToHue = ({ r, g, b }: { r: number; g: number; b: number }): number | null => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) { return null; }
  let h: number;
  if (max === rn) {
    h = ((gn - bn) / delta) % 6;
  }
  else if (max === gn) {
    h = (bn - rn) / delta + 2;
  }
  else {
    h = (rn - gn) / delta + 4;
  }
  return Math.round((h * 60 + 360) % 360);
};

const compareNullableNumberAscNullLast = (a: number | null, b: number | null): number => {
  const aNull = a === null || a === undefined || Number.isNaN(a);
  const bNull = b === null || b === undefined || Number.isNaN(b);
  if (aNull && bNull) { return 0; }
  if (aNull) { return 1; }
  if (bNull) { return -1; }
  return a - b;
};

const makeTagComparator = (sortOrder: PassageNoteTagSortOrder): ((a: PassageNoteTag, b: PassageNoteTag) => number) => {
  switch (sortOrder) {
  case 'createdAt:descending':
    return (a, b) => {
      const byDate = compareNullableNumberAscNullLast(getTagCreatedMsOrNull(b), getTagCreatedMsOrNull(a));
      if (byDate) { return byDate; }
      return compareByLabelAsc(a, b);
    };
  case 'createdAt:ascending':
    return (a, b) => {
      const byDate = compareNullableNumberAscNullLast(getTagCreatedMsOrNull(a), getTagCreatedMsOrNull(b));
      if (byDate) { return byDate; }
      return compareByLabelAsc(a, b);
    };
  case 'noteCount:descending':
    return (a, b) => {
      const aCount = Number(a?.noteCount ?? 0);
      const bCount = Number(b?.noteCount ?? 0);
      const byCount = bCount - aCount;
      if (byCount) { return byCount; }
      return compareByLabelAsc(a, b);
    };
  case 'noteCount:ascending':
    return (a, b) => {
      const aCount = Number(a?.noteCount ?? 0);
      const bCount = Number(b?.noteCount ?? 0);
      const byCount = aCount - bCount;
      if (byCount) { return byCount; }
      return compareByLabelAsc(a, b);
    };
  case 'color:hue':
    return (a, b) => {
      const aRgb = hexToRgb(a?.color);
      const bRgb = hexToRgb(b?.color);
      const aHue = aRgb ? rgbToHue(aRgb) : null;
      const bHue = bRgb ? rgbToHue(bRgb) : null;
      const byHue = compareNullableNumberAscNullLast(aHue, bHue);
      if (byHue) { return byHue; }
      return compareByLabelAsc(a, b);
    };
  case 'label:ascending':
  default:
    return compareByLabelAsc;
  }
};

const normalizeSortOrder = (sortOrder: unknown): PassageNoteTagSortOrder => {
  return (TagSortOrders as readonly string[]).includes(String(sortOrder))
    ? String(sortOrder) as PassageNoteTagSortOrder
    : 'label:ascending';
};

const sortPassageNoteTags = (tags: PassageNoteTag[], sortOrder: PassageNoteTagSortOrder): PassageNoteTag[] => {
  const comparator = makeTagComparator(normalizeSortOrder(sortOrder));
  return tags.sort(comparator);
};

export const usePassageNoteTagsStore = defineStore('passage-note-tags', {
  state: (): PassageNoteTagsState => ({
    passageNoteTags: [],
    sortOrder: 'label:ascending',
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

    async loadPassageNoteTags(): Promise<void> {
      const { $http } = useNuxtApp() as { $http: Http };
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
    },

    async createPassageNoteTag(
      { label, color, description }: { label: unknown; color: unknown; description: unknown },
    ): Promise<PassageNoteTag> {
      const { $http } = useNuxtApp() as { $http: Http };
      const { data: result } = await $http.post<PassageNoteTag>('/api/passage-note-tags', { label, color, description });
      this.addPassageNoteTag(result);
      return result;
    },

    async updatePassageNoteTag(
      { id, label, color, description }: { id: number | string; label: unknown; color: unknown; description: unknown },
    ): Promise<PassageNoteTag | null> {
      const { $http } = useNuxtApp() as { $http: Http };
      const { data } = await $http.put<PassageNoteTag | null>(`/api/passage-note-tags/${id}`, { id, label, color, description });
      if (!data) { return null; }
      this.updatePassageNoteTagInState(data);
      return data;
    },

    async deletePassageNoteTag(passageNoteTagId: number | string): Promise<boolean> {
      const { $http } = useNuxtApp() as { $http: Http };
      const { data } = await $http.delete<unknown>(`/api/passage-note-tags/${passageNoteTagId}`);
      if (data) {
        this.removePassageNoteTag(passageNoteTagId);
        return true;
      }
      return false;
    },
  },
});
