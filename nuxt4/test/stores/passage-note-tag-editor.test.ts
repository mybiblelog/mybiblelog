import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePassageNoteTagEditorStore } from '~/stores/passage-note-tag-editor';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { ApiError } from '~/helpers/api-error';

beforeEach(() => setActivePinia(createPinia()));

describe('passage-note-tag-editor store', () => {
  it('openEditor opens with submitting false', () => {
    const store = usePassageNoteTagEditorStore();
    store.openEditor();
    expect(store.open).toBe(true);
    expect(store.submitting).toBe(false);
  });

  it('ignores a second save while one is in flight (no double submit)', () => {
    const tags = usePassageNoteTagsStore();
    const create = vi.spyOn(tags, 'createPassageNoteTag').mockReturnValue(new Promise(() => {}));
    const store = usePassageNoteTagEditorStore();
    store.openEditor();

    void store.savePassageNoteTag();
    void store.savePassageNoteTag();

    expect(store.submitting).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('creates a tag, resets, and clears submitting on success', async () => {
    const tags = usePassageNoteTagsStore();
    vi.spyOn(tags, 'createPassageNoteTag').mockResolvedValue({ id: 1 } as never);
    vi.spyOn(tags, 'loadPassageNoteTags').mockResolvedValue(undefined as never);
    const store = usePassageNoteTagEditorStore();
    store.openEditor();

    const result = await store.savePassageNoteTag();

    expect(result).toEqual({ id: 1 });
    expect(store.submitting).toBe(false);
    expect(store.open).toBe(false);
  });

  it('takes the update branch when the tag has an id', async () => {
    const tags = usePassageNoteTagsStore();
    const update = vi.spyOn(tags, 'updatePassageNoteTag').mockResolvedValue({ id: 5 } as never);
    const create = vi.spyOn(tags, 'createPassageNoteTag').mockResolvedValue({ id: 99 } as never);
    vi.spyOn(tags, 'loadPassageNoteTags').mockResolvedValue(undefined as never);
    const store = usePassageNoteTagEditorStore();
    store.openEditor();
    store.passageNoteTag.id = 5;

    await store.savePassageNoteTag();

    expect(update).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('maps ApiError, returns null, and clears submitting on failure', async () => {
    const tags = usePassageNoteTagsStore();
    vi.spyOn(tags, 'createPassageNoteTag').mockRejectedValue(
      new ApiError({ code: 'validation', errors: [{ field: 'label', code: 'required' }] }),
    );
    const store = usePassageNoteTagEditorStore();
    store.openEditor();

    const result = await store.savePassageNoteTag();

    expect(result).toBeNull();
    expect(store.errors.label).toEqual({ field: 'label', code: 'required' });
    expect(store.submitting).toBe(false);
  });
});
