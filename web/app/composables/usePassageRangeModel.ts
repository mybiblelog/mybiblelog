import type { Ref } from 'vue';

type PassageRange = { startVerseId: number; endVerseId: number };

type DraftWithPassage = {
  filterPassageStartVerseId?: number;
  filterPassageEndVerseId?: number;
};

/**
 * Bridges a draft query's flat `filterPassageStartVerseId` / `filterPassageEndVerseId`
 * fields and the `{ startVerseId, endVerseId } | null` shape that `VerseInput`
 * consumes. Shared by the log-entry and passage-note query managers. Writes go
 * through the owning draft's `setDraft` so dirty-tracking stays correct.
 */
export function usePassageRangeModel<T extends DraftWithPassage>(
  draft: Ref<T>,
  setDraft: (update: { filterPassageStartVerseId: number; filterPassageEndVerseId: number }) => void,
) {
  return computed<PassageRange | null>({
    get() {
      const startVerseId = Number(draft.value.filterPassageStartVerseId || 0);
      const endVerseId = Number(draft.value.filterPassageEndVerseId || 0);
      if (!startVerseId || !endVerseId) { return null; }
      return { startVerseId, endVerseId };
    },
    set(range: PassageRange | null) {
      if (!range) {
        setDraft({ filterPassageStartVerseId: 0, filterPassageEndVerseId: 0 });
        return;
      }
      setDraft({
        filterPassageStartVerseId: Number(range.startVerseId),
        filterPassageEndVerseId: Number(range.endVerseId),
      });
    },
  });
}
