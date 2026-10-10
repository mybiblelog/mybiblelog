import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";
import { Bible } from "@mybiblelog/shared";
import { appStorage } from "@/src/storage/keys";
import {
  MIN_BOOKS_COMPLETE,
  countCompletedBooks,
  isEligible,
  markRatedViaStore,
  maybeRequestReview,
} from "./reviewPrompt";

const wholeBookEntry = (bookIndex: number) => ({
  startVerseId: Bible.getFirstBookVerseId(bookIndex),
  endVerseId: Bible.getLastBookVerseId(bookIndex),
});

const setPlatform = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
};

describe("isEligible", () => {
  it("requires enough completed books", () => {
    expect(isEligible(null, MIN_BOOKS_COMPLETE)).toBe(true);
    expect(isEligible(null, MIN_BOOKS_COMPLETE - 1)).toBe(false);
  });

  it("is never eligible once the user rated via the store", () => {
    expect(isEligible({ ratedViaStore: true }, 10)).toBe(false);
  });
});

describe("countCompletedBooks", () => {
  it("counts only fully read books", () => {
    const partial = {
      startVerseId: Bible.getFirstBookVerseId(3),
      endVerseId: Bible.getFirstBookVerseId(3),
    };
    expect(countCompletedBooks([wholeBookEntry(1), wholeBookEntry(64), partial])).toBe(2);
  });
});

describe("maybeRequestReview", () => {
  const originalOS = Platform.OS;
  const requestReview = StoreReview.requestReview as jest.Mock;
  const isAvailableAsync = StoreReview.isAvailableAsync as jest.Mock;

  beforeEach(async () => {
    setPlatform("android");
    requestReview.mockReset().mockResolvedValue(undefined);
    isAvailableAsync.mockReset().mockResolvedValue(true);
    await appStorage.remove("reviewPrompt");
  });

  afterAll(() => setPlatform(originalOS));

  it("does nothing off Android", async () => {
    setPlatform("ios");
    await maybeRequestReview(10);
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("requests on every eligible completion, leaving frequency to Google's quota", async () => {
    await maybeRequestReview(MIN_BOOKS_COMPLETE);
    await maybeRequestReview(MIN_BOOKS_COMPLETE + 1);
    expect(requestReview).toHaveBeenCalledTimes(2);
  });

  it("skips when too few books are complete", async () => {
    await maybeRequestReview(MIN_BOOKS_COMPLETE - 1);
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("skips when the API is unavailable", async () => {
    isAvailableAsync.mockResolvedValue(false);
    await maybeRequestReview(MIN_BOOKS_COMPLETE);
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("stops after the user rated via the store", async () => {
    await markRatedViaStore();
    await maybeRequestReview(MIN_BOOKS_COMPLETE);
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("swallows API errors", async () => {
    requestReview.mockRejectedValue(new Error("boom"));
    await expect(maybeRequestReview(MIN_BOOKS_COMPLETE)).resolves.toBeUndefined();
  });
});
