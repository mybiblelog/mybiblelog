import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

export type ResolvedPassageNoteTag = {
  id: string | number;
  label: string;
  color: string;
};

type TagLike = { id: string | number; label?: string; color?: string };

const DEFAULT_TAG_COLOR = 'var(--mbl-text-strong)';

/**
 * Resolves a list of tag IDs into display-ready `{ id, label, color }` objects
 * against the known passage-note tags. Shared by the notes list, the note
 * editor, and the notes query manager, which each previously reimplemented this.
 *
 * Options cover the small behavioural differences between call sites:
 * - `placeholderLabel` — when the tag set has not loaded yet, every ID renders
 *   with this label instead of being dropped (e.g. a loading dash/spinner text).
 * - `keepUnknown` — keep IDs that don't match any loaded tag, rendering the raw
 *   ID as the label (used by the query manager); otherwise unknown IDs are dropped.
 * - `defaultColor` — fallback colour for a tag with no colour and for unknown/placeholder tags.
 */
export function useResolvedPassageNoteTags(
  tagIds: MaybeRefOrGetter<Array<string | number> | undefined | null>,
  options: {
    tags?: MaybeRefOrGetter<TagLike[] | undefined | null>;
    placeholderLabel?: () => string;
    keepUnknown?: boolean;
    defaultColor?: string;
  } = {},
): ComputedRef<ResolvedPassageNoteTag[]> {
  const passageNoteTagsStore = usePassageNoteTagsStore();
  const defaultColor = options.defaultColor ?? DEFAULT_TAG_COLOR;

  return computed(() => {
    const ids = toValue(tagIds) ?? [];
    const allTags = toValue(options.tags) ?? passageNoteTagsStore.passageNoteTags ?? [];

    if (!allTags.length && options.placeholderLabel) {
      const label = options.placeholderLabel();
      return ids.map(id => ({ id, label, color: defaultColor }));
    }

    const byId = new Map(allTags.map(tag => [String(tag.id), tag]));
    const resolved: ResolvedPassageNoteTag[] = [];
    for (const id of ids) {
      const tag = byId.get(String(id));
      if (tag) {
        resolved.push({ id, label: tag.label ?? '', color: tag.color ?? defaultColor });
      }
      else if (options.keepUnknown) {
        resolved.push({ id, label: String(id), color: defaultColor });
      }
    }
    return resolved;
  });
}
