import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { Bible } from '@mybiblelog/shared';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { useLogEntriesStore } from '~/stores/log-entries';
import { ApiError } from '~/helpers/api-error';

beforeEach(() => setActivePinia(createPinia()));

describe('log-entry-editor store', () => {
  it('openEditor opens the editor with a date and not submitting', () => {
    const store = useLogEntryEditorStore();
    store.openEditor({ empty: true });
    expect(store.open).toBe(true);
    expect(store.submitting).toBe(false);
    expect(store.logEntry.date).toBeTruthy();
  });

  // Guards the double-submit protection added to saveLogEntry.
  it('ignores a second save while one is in flight (no double submit)', () => {
    const entries = useLogEntriesStore();
    const create = vi.spyOn(entries, 'createLogEntry').mockReturnValue(new Promise(() => {}));
    const store = useLogEntryEditorStore();
    store.openEditor({ empty: true });

    void store.saveLogEntry();
    void store.saveLogEntry();

    expect(store.submitting).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('creates a new entry, resets, and clears submitting on success', async () => {
    const entries = useLogEntriesStore();
    const saved = { id: 1, date: '2026-01-01', startVerseId: 1, endVerseId: 1 };
    vi.spyOn(entries, 'createLogEntry').mockResolvedValue(saved as never);
    const store = useLogEntryEditorStore();
    store.openEditor({ empty: true });

    const result = await store.saveLogEntry();

    expect(result).toEqual(saved);
    expect(store.submitting).toBe(false);
    expect(store.open).toBe(false); // $reset() ran
  });

  it('takes the update branch when the entry has an id', async () => {
    const entries = useLogEntriesStore();
    const update = vi.spyOn(entries, 'updateLogEntry').mockResolvedValue({ id: 5 } as never);
    const create = vi.spyOn(entries, 'createLogEntry').mockResolvedValue({ id: 99 } as never);
    const store = useLogEntryEditorStore();
    store.openEditor({ empty: true });
    store.logEntry.id = 5;

    await store.saveLogEntry();

    expect(update).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  });

  it('maps ApiError field errors, clears submitting, and rethrows', async () => {
    const entries = useLogEntriesStore();
    vi.spyOn(entries, 'createLogEntry').mockRejectedValue(
      new ApiError({ code: 'validation', errors: [{ field: 'date', code: 'invalid' }] }),
    );
    const store = useLogEntryEditorStore();
    store.openEditor({ empty: true });

    await expect(store.saveLogEntry()).rejects.toBeInstanceOf(ApiError);
    expect(store.errors.date).toEqual({ field: 'date', code: 'invalid' });
    expect(store.submitting).toBe(false);
  });

  it('setVerseRange sets the passage and recomputes validity', () => {
    const store = useLogEntryEditorStore();
    store.openEditor({ empty: true });
    expect(store.isValid).toBe(false);

    const range = {
      startVerseId: Bible.makeVerseId(43, 3, 16),
      endVerseId: Bible.makeVerseId(43, 3, 18),
    };
    store.setVerseRange(range);
    expect(store.logEntry.startVerseId).toBe(range.startVerseId);
    expect(store.logEntry.endVerseId).toBe(range.endVerseId);
    expect(store.logEntry.book).toBe(43);
    expect(store.isValid).toBe(true);

    store.setVerseRange(null);
    expect(store.logEntry.startVerseId).toBeNull();
    expect(store.isValid).toBe(false);
  });

  it('an invalid passage input blocks validity until it recovers', () => {
    const store = useLogEntryEditorStore();
    store.openEditor({ empty: true });
    store.setVerseRange({
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 10),
    });
    expect(store.isValid).toBe(true);

    // The user mangles the text: the input reports invalid and a null range.
    store.setVerseRange(null);
    store.setPassageInputValid(false);
    expect(store.isValid).toBe(false);

    store.setVerseRange({
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 10),
    });
    store.setPassageInputValid(true);
    expect(store.isValid).toBe(true);
  });

  it('allows a retry after a failed save', async () => {
    const entries = useLogEntriesStore();
    const create = vi.spyOn(entries, 'createLogEntry')
      .mockRejectedValueOnce(new ApiError({ code: 'oops' }))
      .mockResolvedValueOnce({ id: 7 } as never);
    const store = useLogEntryEditorStore();
    store.openEditor({ empty: true });

    await expect(store.saveLogEntry()).rejects.toBeInstanceOf(ApiError);
    expect(store.submitting).toBe(false);

    const result = await store.saveLogEntry();
    expect(result).toEqual({ id: 7 });
    expect(create).toHaveBeenCalledTimes(2);
  });
});
