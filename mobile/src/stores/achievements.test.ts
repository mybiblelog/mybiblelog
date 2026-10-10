import { Bible } from "@mybiblelog/shared";
import { maybeRequestReview } from "@/src/review/reviewPrompt";
import { REVIEW_REQUEST_DELAY_MS, achievementActions, useAchievementsStore } from "./achievements";

jest.mock("@/src/review/reviewPrompt", () => ({
  ...jest.requireActual("@/src/review/reviewPrompt"),
  maybeRequestReview: jest.fn(async () => {}),
}));

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

describe("review request", () => {
  const request = maybeRequestReview as jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    request.mockClear();
    // Drain any completion left pending by earlier tests.
    achievementActions.close();
    jest.runAllTimers();
    request.mockClear();
  });

  afterEach(() => jest.useRealTimers());

  it("requests a review after the celebration closes, with the completed-book count", () => {
    achievementActions.evaluate(64, [wholeBookEntry(1)], [wholeBookEntry(1), wholeBookEntry(64)]);
    expect(request).not.toHaveBeenCalled();

    achievementActions.close();
    jest.advanceTimersByTime(REVIEW_REQUEST_DELAY_MS);
    expect(request).toHaveBeenCalledWith(2);
  });

  it("does not request a review when nothing was completed", () => {
    achievementActions.show({ type: "book", bookIndex: 64 });
    achievementActions.close();
    jest.runAllTimers();
    expect(request).not.toHaveBeenCalled();
  });

  it("requests only once per completion", () => {
    achievementActions.evaluate(64, [], [wholeBookEntry(64)]);
    achievementActions.close();
    achievementActions.close();
    jest.runAllTimers();
    expect(request).toHaveBeenCalledTimes(1);
  });
});
