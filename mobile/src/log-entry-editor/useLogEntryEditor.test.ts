import { act, renderHook } from "@testing-library/react-native";
import { useLogEntryEditor } from "./useLogEntryEditor";

// Selects a complete, valid Genesis 1:1–1:2 range on the hook.
async function selectGenesisRange(result: { current: ReturnType<typeof useLogEntryEditor> }) {
  await act(() => result.current.selectBook(1));
  await act(() => result.current.selectStartChapter(1));
  await act(() => result.current.selectStartVerse(1));
  await act(() => result.current.selectEndChapter(1));
  await act(() => result.current.selectEndVerse(2));
}

describe("useLogEntryEditor", () => {
  it("starts invalid with no book selected and not dirty", async () => {
    const { result } = await renderHook(() => useLogEntryEditor());
    expect(result.current.value.book).toBe(0);
    expect(result.current.derived.isValid).toBe(false);
    expect(result.current.derived.isDirty).toBe(false);
  });

  it("becomes valid once a complete range is chosen", async () => {
    const { result } = await renderHook(() => useLogEntryEditor());
    await selectGenesisRange(result);
    expect(result.current.derived.isValid).toBe(true);
    expect(typeof result.current.derived.startVerseId).toBe("number");
    expect(result.current.derived.endVerseId).toBeGreaterThanOrEqual(
      result.current.derived.startVerseId!
    );
  });

  it("populates dependent option lists after selecting a book", async () => {
    const { result } = await renderHook(() => useLogEntryEditor());
    expect(result.current.startChapters).toHaveLength(0);
    await act(() => result.current.selectBook(1)); // Genesis has 50 chapters
    expect(result.current.startChapters).toHaveLength(50);
  });

  it("ignores an empty date (guarded no-op), keeping the prior value", async () => {
    const { result } = await renderHook(() => useLogEntryEditor({ date: "2026-06-27" }));
    await selectGenesisRange(result);
    expect(result.current.derived.isValid).toBe(true);
    await act(() => result.current.updateDate(""));
    // The shared machine guards against clearing the date, so it stays valid.
    expect(result.current.value.date).toBe("2026-06-27");
    expect(result.current.derived.isValid).toBe(true);
  });

  it("is invalid when given a malformed date", async () => {
    const { result } = await renderHook(() => useLogEntryEditor());
    await selectGenesisRange(result);
    expect(result.current.derived.isValid).toBe(true);
    await act(() => result.current.updateDate("not-a-date"));
    expect(result.current.derived.isValid).toBe(false);
  });

  it("tracks dirty state and clears it with reset", async () => {
    const { result } = await renderHook(() => useLogEntryEditor());
    await act(() => result.current.selectBook(1));
    expect(result.current.derived.isDirty).toBe(true);
    await act(() => result.current.reset());
    expect(result.current.derived.isDirty).toBe(false);
  });

  it("serializes to a LogEntry only when valid", async () => {
    const { result } = await renderHook(() => useLogEntryEditor({ date: "2026-06-27" }));
    expect(result.current.toLogEntry()).toBeNull();
    await selectGenesisRange(result);
    await act(() => result.current.updateDate("2026-06-27"));
    const entry = result.current.toLogEntry();
    expect(entry).toMatchObject({ date: "2026-06-27" });
    expect(entry?.startVerseId).toBe(result.current.derived.startVerseId);
  });

  it("reset restores a clean, fresh model", async () => {
    const { result } = await renderHook(() => useLogEntryEditor());
    await selectGenesisRange(result);
    await act(() => result.current.reset());
    expect(result.current.value.book).toBe(0);
    expect(result.current.derived.isDirty).toBe(false);
  });
});
