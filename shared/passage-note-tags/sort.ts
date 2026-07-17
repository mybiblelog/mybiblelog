/**
 * Framework-agnostic passage-note-tag sorting.
 *
 * The tag list is sorted the same way on every surface (the web Pinia store
 * today, a mobile equivalent tomorrow). The comparators encode a few non-obvious
 * rules — a locale-aware label collator that ignores leading punctuation, an
 * ObjectId-timestamp fallback when a tag has no explicit `createdAt`, and a
 * hue-based colour sort — so the logic lives here once, pure and unit-tested,
 * rather than inline in a store.
 */

export const TagSortOrders = [
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

export const compareByLabelAsc = (a: PassageNoteTag, b: PassageNoteTag): number => {
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

export const getObjectIdCreatedMsOrNull = (id: unknown): number | null => {
  const hex = String(id ?? '').trim();
  if (!/^[0-9a-f]{24}$/i.test(hex)) { return null; }
  const seconds = parseInt(hex.slice(0, 8), 16);
  if (!Number.isFinite(seconds)) { return null; }
  return seconds * 1000;
};

export const getTagCreatedMsOrNull = (tag: PassageNoteTag | null | undefined): number | null => {
  return getDateMsOrNull(tag?.createdAt) ??
    getObjectIdCreatedMsOrNull(tag?.id) ??
    getObjectIdCreatedMsOrNull(tag?._id);
};

export const normalizeHexColor = (hex: unknown): string | null => {
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

export const hexToRgb = (hex: unknown): { r: number; g: number; b: number } | null => {
  const normalized = normalizeHexColor(hex);
  if (!normalized) { return null; }
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  if (![r, g, b].every(Number.isFinite)) { return null; }
  return { r, g, b };
};

export const rgbToHue = ({ r, g, b }: { r: number; g: number; b: number }): number | null => {
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

export const makeTagComparator = (
  sortOrder: PassageNoteTagSortOrder,
): ((a: PassageNoteTag, b: PassageNoteTag) => number) => {
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

export const normalizeSortOrder = (sortOrder: unknown): PassageNoteTagSortOrder => {
  return (TagSortOrders as readonly string[]).includes(String(sortOrder))
    ? String(sortOrder) as PassageNoteTagSortOrder
    : 'label:ascending';
};

export const sortPassageNoteTags = (
  tags: PassageNoteTag[],
  sortOrder: PassageNoteTagSortOrder,
): PassageNoteTag[] => {
  const comparator = makeTagComparator(normalizeSortOrder(sortOrder));
  return tags.sort(comparator);
};
