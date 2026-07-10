import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { usePassageNotesStore } from '~/stores/passage-notes';
import { ApiError } from '~/helpers/api-error';

beforeEach(() => setActivePinia(createPinia()));

describe('passage-note-editor store', () => {
  it('openEditor opens with submitting false', () => {
    const store = usePassageNoteEditorStore();
    store.openEditor();
    expect(store.open).toBe(true);
    expect(store.submitting).toBe(false);
  });

  it('ignores a second save while one is in flight (no double submit)', () => {
    const notes = usePassageNotesStore();
    const create = vi.spyOn(notes, 'createPassageNote').mockReturnValue(new Promise(() => {}));
    const store = usePassageNoteEditorStore();
    store.openEditor();

    void store.savePassageNote();
    void store.savePassageNote();

    expect(store.submitting).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('creates a note, resets, and clears submitting on success', async () => {
    const notes = usePassageNotesStore();
    vi.spyOn(notes, 'createPassageNote').mockResolvedValue({ id: 1 } as never);
    const store = usePassageNoteEditorStore();
    store.openEditor();

    const result = await store.savePassageNote();

    expect(result).toEqual({ id: 1 });
    expect(store.submitting).toBe(false);
    expect(store.open).toBe(false);
  });

  it('takes the update branch when the note has an id', async () => {
    const notes = usePassageNotesStore();
    const update = vi.spyOn(notes, 'updatePassageNote').mockResolvedValue({ id: 5 } as never);
    const create = vi.spyOn(notes, 'createPassageNote').mockResolvedValue({ id: 99 } as never);
    const store = usePassageNoteEditorStore();
    store.openEditor();
    store.passageNote.id = 5;

    await store.savePassageNote();

    expect(update).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('maps ApiError, returns null, and clears submitting on failure', async () => {
    const notes = usePassageNotesStore();
    vi.spyOn(notes, 'createPassageNote').mockRejectedValue(
      new ApiError({ code: 'validation', errors: [{ field: 'content', code: 'required' }] }),
    );
    const store = usePassageNoteEditorStore();
    store.openEditor();

    const result = await store.savePassageNote();

    expect(result).toBeNull();
    expect(store.errors.content).toEqual({ field: 'content', code: 'required' });
    expect(store.submitting).toBe(false);
  });
});
