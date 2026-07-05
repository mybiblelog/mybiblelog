import { Bible } from "@mybiblelog/shared";
import { achievementActions, useAchievementsStore } from "./achievements";

// A single entry spanning an entire book (completes it in one range).
const wholeBookEntry = (bookIndex: number) => ({
  startVerseId: Bible.getFirstBookVerseId(bookIndex),
  endVerseId: Bible.getLastBookVerseId(bookIndex),
});

beforeEach(() => {
  useAchievementsStore.setState({ current: null });
});

describe("show / close", () => {
  it("holds the shown achievement until closed", () => {
    achievementActions.show({ type: "book", bookIndex: 64 });
    expect(useAchievementsStore.getState().current).toEqual({ type: "book", bookIndex: 64 });
    achievementActions.close();
    expect(useAchievementsStore.getState().current).toBeNull();
  });
});

describe("evaluate", () => {
  it("shows a book achievement when the mutation completes the book", () => {
    achievementActions.evaluate(64, [], [wholeBookEntry(64)]);
    expect(useAchievementsStore.getState().current).toEqual({ type: "book", bookIndex: 64 });
  });

  it("shows nothing when the book is still incomplete", () => {
    const partial = {
      startVerseId: Bible.getFirstBookVerseId(64),
      endVerseId: Bible.getFirstBookVerseId(64),
    };
    achievementActions.evaluate(64, [], [partial]);
    expect(useAchievementsStore.getState().current).toBeNull();
  });

  it("shows nothing when the book was already complete before", () => {
    achievementActions.evaluate(64, [wholeBookEntry(64)], [wholeBookEntry(64)]);
    expect(useAchievementsStore.getState().current).toBeNull();
  });
});
