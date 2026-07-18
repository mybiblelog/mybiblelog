import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { usePassageRangeModel } from '~/composables/usePassageRangeModel';

const makeDraft = () => {
  const draft = ref({ filterPassageStartVerseId: 0, filterPassageEndVerseId: 0 });
  const setDraft = (update: { filterPassageStartVerseId: number; filterPassageEndVerseId: number }) => {
    draft.value = { ...draft.value, ...update };
  };
  return { draft, setDraft };
};

describe('usePassageRangeModel', () => {
  it('reads null when no range is set', () => {
    const { draft, setDraft } = makeDraft();
    const model = usePassageRangeModel(draft, setDraft);
    expect(model.value).toBeNull();
  });

  it('reads null when only one endpoint is set', () => {
    const { draft, setDraft } = makeDraft();
    draft.value = { filterPassageStartVerseId: 5, filterPassageEndVerseId: 0 };
    const model = usePassageRangeModel(draft, setDraft);
    expect(model.value).toBeNull();
  });

  it('writes a range into the draft fields', () => {
    const { draft, setDraft } = makeDraft();
    const model = usePassageRangeModel(draft, setDraft);
    model.value = { startVerseId: 101001001, endVerseId: 101001005 };
    expect(draft.value).toMatchObject({ filterPassageStartVerseId: 101001001, filterPassageEndVerseId: 101001005 });
    expect(model.value).toEqual({ startVerseId: 101001001, endVerseId: 101001005 });
  });

  it('clears both fields when set to null', () => {
    const { draft, setDraft } = makeDraft();
    draft.value = { filterPassageStartVerseId: 5, filterPassageEndVerseId: 9 };
    const model = usePassageRangeModel(draft, setDraft);
    model.value = null;
    expect(draft.value).toMatchObject({ filterPassageStartVerseId: 0, filterPassageEndVerseId: 0 });
  });
});
