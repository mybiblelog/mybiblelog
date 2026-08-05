import type { TranslationKey } from "@/src/i18n";

type Translate = (key: TranslationKey, options?: Record<string, unknown>) => string;

export type VerseCountParts = {
  /** Total verses in the passage. */
  count: number;
  /** How many of those had never been read since the tracker start. */
  newVerseCount?: number;
};

const plural = (t: Translate, one: TranslationKey, other: TranslationKey, n: number) =>
  n === 1 ? t(one) : t(other);

/**
 * The verse-count line under a log entry's passage, matching web's
 * `displayVerseCountMessage` in `LogEntry.vue`:
 *
 *   "12 verses"                — nothing new (or the count is unknown)
 *   "12 verses - 5 new"        — partly new
 *   "12 verses - all new"      — every verse was new
 *
 * The "all" wording matters: "12 verses - 12 new" reads like a coincidence,
 * "all new" reads like an achievement.
 */
export function formatVerseCountMessage(t: Translate, { count, newVerseCount }: VerseCountParts) {
  const verses = plural(t, "verse_count_verse_one", "verse_count_verse_other", count);

  if (!newVerseCount) return `${count} ${verses}`;

  const isAllNew = newVerseCount === count;
  const quantity = isAllNew
    ? plural(t, "verse_count_all_one", "verse_count_all_other", newVerseCount)
    : String(newVerseCount);
  const fresh = plural(t, "verse_count_new_one", "verse_count_new_other", newVerseCount);

  return `${count} ${verses} - ${quantity} ${fresh}`;
}
