import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { usePassageNotesStore } from '~/stores/passage-notes';
import { ApiError } from '~/helpers/api-error';
import { confirmDiscardIfDirty } from '~/helpers/confirm-discard';

vi.mock('~/helpers/confirm-discard', () => ({
  confirmDiscardIfDirty: vi.fn(),
}));

beforeEach(() => {
  setActivePinia(createPinia());
  vi.mocked(confirmDiscardIfDirty).mockReset();
});

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

  it('maps a non-ApiError failure to the UnknownApiError fallback', async () => {
    const notes = usePassageNotesStore();
    vi.spyOn(notes, 'createPassageNote').mockRejectedValue(new Error('boom'));
    const store = usePassageNoteEditorStore();
    store.openEditor();

    const result = await store.savePassageNote();

    expect(result).toBeNull();
    expect(store.errors._form).toEqual({ field: null, code: 'unknown_error' });
    expect(store.submitting).toBe(false);
  });

  it('closeEditor keeps the editor open when the user cancels the discard confirm', async () => {
    vi.mocked(confirmDiscardIfDirty).mockResolvedValue(false);
    const store = usePassageNoteEditorStore();
    store.openEditor();
    store.updatePassageNote({ ...store.passageNote, content: 'changed' });

    const closed = await store.closeEditor({});

    expect(confirmDiscardIfDirty).toHaveBeenCalledTimes(1);
    expect(closed).toBe(false);
    expect(store.open).toBe(true);
  });

  it('closeEditor discards and resets when the user confirms the discard', async () => {
    vi.mocked(confirmDiscardIfDirty).mockResolvedValue(true);
    const store = usePassageNoteEditorStore();
    store.openEditor();
    store.updatePassageNote({ ...store.passageNote, content: 'changed' });

    const closed = await store.closeEditor({});

    expect(confirmDiscardIfDirty).toHaveBeenCalledTimes(1);
    expect(closed).toBe(true);
    expect(store.open).toBe(false);
  });
});
