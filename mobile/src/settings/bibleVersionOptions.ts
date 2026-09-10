import { bibleVersionNames } from "@mybiblelog/shared";

/**
 * Display options for the translations users can pick as their preferred
 * Bible version, shaped for the mobile picker component (shared exports
 * `{value, text}[]`; this adapts it to `{value, label}[]`). Names come
 * straight from `@mybiblelog/shared` so this list can't drift from the
 * shared translation data the way a hand-copied version could.
 */
export const bibleVersionOptions: { value: string; label: string }[] = Object.entries(
  bibleVersionNames
).map(([value, label]) => ({ value, label }));
