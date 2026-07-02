import { act, renderHook } from '@testing-library/react-native';
import { useLogEntryEditor } from './useLogEntryEditor';

// Selects a complete, valid Genesis 1:1–1:2 range on the hook.
function selectGenesisRange(result: { current: ReturnType<typeof useLogEntryEditor> }) {
  act(() => result.current.selectBook(1));
  act(() => result.current.selectStartChapter(1));
  act(() => result.current.selectStartVerse(1));
  act(() => result.current.selectEndChapter(1));
  act(() => result.current.selectEndVerse(2));
}

describe('useLogEntryEditor', () => {
  it('starts invalid with no book selected and not dirty', () => {
    const { result } = renderHook(() => useLogEntryEditor());
    expect(result.current.value.book).toBe(0);
    expect(result.current.derived.isValid).toBe(false);
    expect(result.current.derived.isDirty).toBe(false);
  });

  it('becomes valid once a complete range is chosen', () => {
    const { result } = renderHook(() => useLogEntryEditor());
    selectGenesisRange(result);
    expect(result.current.derived.isValid).toBe(true);
    expect(typeof result.current.derived.startVerseId).toBe('number');
    expect(result.current.derived.endVerseId).toBeGreaterThanOrEqual(
      result.current.derived.startVerseId!,
    );
  });

  it('populates dependent option lists after selecting a book', () => {
    const { result } = renderHook(() => useLogEntryEditor());
    expect(result.current.startChapters).toHaveLength(0);
    act(() => result.current.selectBook(1)); // Genesis has 50 chapters
    expect(result.current.startChapters).toHaveLength(50);
  });

  it('ignores an empty date (guarded no-op), keeping the prior value', () => {
    const { result } = renderHook(() => useLogEntryEditor({ date: '2026-06-27' }));
    selectGenesisRange(result);
    expect(result.current.derived.isValid).toBe(true);
    act(() => result.current.updateDate(''));
    // The shared machine guards against clearing the date, so it stays valid.
    expect(result.current.value.date).toBe('2026-06-27');
    expect(result.current.derived.isValid).toBe(true);
  });

  it('is invalid when given a malformed date', () => {
    const { result } = renderHook(() => useLogEntryEditor());
    selectGenesisRange(result);
    expect(result.current.derived.isValid).toBe(true);
    act(() => result.current.updateDate('not-a-date'));
    expect(result.current.derived.isValid).toBe(false);
  });

  it('tracks dirty state and clears it with markClean', () => {
    const { result } = renderHook(() => useLogEntryEditor());
    act(() => result.current.selectBook(1));
    expect(result.current.derived.isDirty).toBe(true);
    act(() => result.current.markClean());
    expect(result.current.derived.isDirty).toBe(false);
  });

  it('serializes to a LogEntry only when valid', () => {
    const { result } = renderHook(() => useLogEntryEditor({ date: '2026-06-27' }));
    expect(result.current.toLogEntry()).toBeNull();
    selectGenesisRange(result);
    act(() => result.current.updateDate('2026-06-27'));
    const entry = result.current.toLogEntry();
    expect(entry).toMatchObject({ date: '2026-06-27' });
    expect(entry?.startVerseId).toBe(result.current.derived.startVerseId);
  });

  it('reset restores a clean, fresh model', () => {
    const { result } = renderHook(() => useLogEntryEditor());
    selectGenesisRange(result);
    act(() => result.current.reset());
    expect(result.current.value.book).toBe(0);
    expect(result.current.derived.isDirty).toBe(false);
  });
});
