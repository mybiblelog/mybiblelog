import { Bible } from "@mybiblelog/shared";
import { act, renderHook } from "@testing-library/react-native";
import { usePassageSelection } from "./usePassageSelection";

const GENESIS = 1; // 50 chapters — exercises multi-chapter auto-fill.
// First single-chapter book (Obadiah) — exercises the collapse-to-one-chapter path.
const SINGLE_CHAPTER_BOOK = Bible.getBooks().find(
  (b) => Bible.getBookChapterCount(b.bibleOrder) === 1
)!.bibleOrder;

describe("usePassageSelection", () => {
  it("starts empty and invalid with no book selected", () => {
    const { result } = renderHook(() => usePassageSelection());
    expect(result.current.state.book).toBe(0);
    expect(result.current.range).toBeNull();
    expect(result.current.isValid).toBe(false);
  });

  it("auto-fills the whole book when a book is selected", () => {
    const { result } = renderHook(() => usePassageSelection());
    act(() => result.current.selectBook(GENESIS));

    const lastChapter = Bible.getBookChapterCount(GENESIS);
    const lastVerse = Bible.getChapterVerseCount(GENESIS, lastChapter);

    // Every field is populated so no downstream select row is left empty/disabled.
    expect(result.current.state).toEqual({
      book: GENESIS,
      startChapter: 1,
      startVerse: 1,
      endChapter: lastChapter,
      endVerse: lastVerse,
    });
    // The resulting range spans the entire book and is immediately valid.
    expect(result.current.range).toEqual({
      startVerseId: Bible.makeVerseId(GENESIS, 1, 1),
      endVerseId: Bible.makeVerseId(GENESIS, lastChapter, lastVerse),
    });
    expect(result.current.isValid).toBe(true);
  });

  it("auto-fills a single-chapter book to its one full chapter", () => {
    const { result } = renderHook(() => usePassageSelection());
    act(() => result.current.selectBook(SINGLE_CHAPTER_BOOK));

    const lastVerse = Bible.getChapterVerseCount(SINGLE_CHAPTER_BOOK, 1);
    expect(result.current.state).toEqual({
      book: SINGLE_CHAPTER_BOOK,
      startChapter: 1,
      startVerse: 1,
      endChapter: 1,
      endVerse: lastVerse,
    });
    expect(result.current.isValid).toBe(true);
  });

  it("keeps every field populated and editable when the start chapter changes", () => {
    const DEUTERONOMY = 5;
    const { result } = renderHook(() => usePassageSelection());
    act(() => result.current.selectBook(DEUTERONOMY));
    act(() => result.current.selectStartChapter(2));

    // Changing the start chapter collapses to that whole chapter (the Log Entry
    // editor flow) — the verses are NOT cleared, so the end-chapter/verse rows
    // stay enabled and the selection stays valid.
    const ch2Verses = Bible.getChapterVerseCount(DEUTERONOMY, 2);
    expect(result.current.state).toEqual({
      book: DEUTERONOMY,
      startChapter: 2,
      startVerse: 1,
      endChapter: 2,
      endVerse: ch2Verses,
    });
    expect(result.current.isValid).toBe(true);

    // The end chapter can then be widened from there.
    act(() => result.current.selectEndChapter(4));
    expect(result.current.state.endChapter).toBe(4);
    expect(result.current.isValid).toBe(true);
  });

  it("lets the user narrow the passage after the book auto-fill", () => {
    const { result } = renderHook(() => usePassageSelection());
    act(() => result.current.selectBook(GENESIS));
    act(() => result.current.selectStartChapter(1));
    act(() => result.current.selectStartVerse(1));
    act(() => result.current.selectEndChapter(1));
    act(() => result.current.selectEndVerse(2));

    expect(result.current.range).toEqual({
      startVerseId: Bible.makeVerseId(GENESIS, 1, 1),
      endVerseId: Bible.makeVerseId(GENESIS, 1, 2),
    });
    expect(result.current.isValid).toBe(true);
  });

  it("pre-populates from an initial range", () => {
    const initialRange = {
      startVerseId: Bible.makeVerseId(GENESIS, 1, 1),
      endVerseId: Bible.makeVerseId(GENESIS, 1, 3),
    };
    const { result } = renderHook(() => usePassageSelection(initialRange));
    expect(result.current.range).toEqual(initialRange);
    expect(result.current.isValid).toBe(true);
  });

  it("reset clears back to an empty selection", () => {
    const { result } = renderHook(() => usePassageSelection());
    act(() => result.current.selectBook(GENESIS));
    expect(result.current.isValid).toBe(true);
    act(() => result.current.reset());
    expect(result.current.state.book).toBe(0);
    expect(result.current.range).toBeNull();
    expect(result.current.isValid).toBe(false);
  });
});
