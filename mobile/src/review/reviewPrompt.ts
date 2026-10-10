import * as StoreReview from "expo-store-review";
import { Platform } from "react-native";
import { Bible, type CompletionLogEntry, isBookComplete } from "@mybiblelog/shared";
import { reportHandledError } from "@/src/observability/sentry";
import { appStorage } from "@/src/storage/keys";

/**
 * Android in-app review prompt (Google Play In-App Review API via
 * `expo-store-review`), requested after the user finishes a book.
 *
 * Frequency is left entirely to Google: Play enforces a per-device quota and
 * silently skips the card when it's exhausted, and it never tells the app
 * whether the user rated or dismissed. A local cooldown/cap would only
 * duplicate that quota and waste completions it would have allowed. We gate
 * only on what Google can't know: that the moment is meaningful (enough books
 * finished), and that the user already went to rate via the Settings ▸ About
 * store link.
 */

export type ReviewPromptState = {
  /** The user opened the Play Store listing from Settings ▸ About. */
  ratedViaStore: boolean;
};

export const MIN_BOOKS_COMPLETE = 2;

export function isEligible(state: ReviewPromptState | null, completedBooks: number): boolean {
  if (state?.ratedViaStore) return false;
  return completedBooks >= MIN_BOOKS_COMPLETE;
}

export function countCompletedBooks(entries: readonly CompletionLogEntry[]): number {
  let count = 0;
  for (let i = 1; i <= Bible.getBookCount(); i++) {
    if (isBookComplete(i, entries)) count++;
  }
  return count;
}

/** Request the review card if the user is eligible. Never throws. */
export async function maybeRequestReview(completedBooks: number): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    if (!isEligible(await appStorage.get("reviewPrompt"), completedBooks)) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    await StoreReview.requestReview();
  } catch (err) {
    reportHandledError(err, { op: "review.maybeRequestReview" });
  }
}

/** The user went to the Play Store listing to rate; stop automatic requests. */
export async function markRatedViaStore(): Promise<void> {
  try {
    await appStorage.set("reviewPrompt", { ratedViaStore: true });
  } catch (err) {
    reportHandledError(err, { op: "review.markRatedViaStore" });
  }
}
