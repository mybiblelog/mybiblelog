import { describe, it, expect, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { useDraftQuery } from '~/composables/useDraftQuery';

type Query = { limit: number; searchText: string; tags: string[] };

const normalize = (q: Partial<Query> | null | undefined): Query => {
  const src = q || {};
  return {
    limit: Number(src.limit ?? 10),
    searchText: src.searchText ?? '',
    tags: Array.isArray(src.tags) ? [...src.tags] : [],
  };
};

describe('useDraftQuery', () => {
  it('starts with a normalized, non-dirty draft', () => {
    const applied = ref<Partial<Query>>({ searchText: 'hi' });
    const { draft, isDirty } = useDraftQuery(() => applied.value, normalize, vi.fn());
    expect(draft.value).toEqual({ limit: 10, searchText: 'hi', tags: [] });
    expect(isDirty.value).toBe(false);
  });

  it('becomes dirty after setDraft and clean again when reverted', () => {
    const applied = ref<Partial<Query>>({});
    const { isDirty, setDraft } = useDraftQuery(() => applied.value, normalize, vi.fn());
    setDraft({ searchText: 'abc' });
    expect(isDirty.value).toBe(true);
    setDraft({ searchText: '' });
    expect(isDirty.value).toBe(false);
  });

  it('emits a normalized query on apply and clears dirty', () => {
    const applied = ref<Partial<Query>>({});
    const emit = vi.fn();
    const { setDraft, applyDraft, isDirty } = useDraftQuery(() => applied.value, normalize, emit);
    setDraft({ limit: 20 });
    applyDraft();
    expect(emit).toHaveBeenCalledWith('apply', { limit: 20, searchText: '', tags: [] });
    expect(isDirty.value).toBe(false);
  });

  it('reverts the draft and emits cancel', () => {
    const applied = ref<Partial<Query>>({ searchText: 'orig' });
    const emit = vi.fn();
    const { draft, setDraft, cancelDraft } = useDraftQuery(() => applied.value, normalize, emit);
    setDraft({ searchText: 'changed' });
    cancelDraft();
    expect(draft.value.searchText).toBe('orig');
    expect(emit).toHaveBeenCalledWith('cancel');
  });

  it('resyncs when the applied query changes and the draft is clean', async () => {
    const applied = ref<Partial<Query>>({ searchText: 'a' });
    const { draft } = useDraftQuery(() => applied.value, normalize, vi.fn());
    applied.value = { searchText: 'b' };
    await nextTick();
    expect(draft.value.searchText).toBe('b');
  });

  it('does not clobber an in-progress draft when the applied query changes', async () => {
    const applied = ref<Partial<Query>>({ searchText: 'a' });
    const { draft, setDraft } = useDraftQuery(() => applied.value, normalize, vi.fn());
    setDraft({ searchText: 'editing' });
    applied.value = { searchText: 'b' };
    await nextTick();
    expect(draft.value.searchText).toBe('editing');
  });
});
