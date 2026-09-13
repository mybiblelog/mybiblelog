import {
  bibleVersionNames,
  localeVersionGroups,
  locales,
  type LocaleCode,
} from "@mybiblelog/shared";
import type { SelectSection } from "@/src/components";

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

/**
 * The same translations as {@link bibleVersionOptions}, grouped into
 * per-language sections (labeled with each language's native name) for the
 * picker's sectioned sheet — mirrors the `<optgroup>`s on web. The caller's
 * locale group is sorted first; the rest keep their existing relative order.
 */
export function getBibleVersionSections(locale: LocaleCode): SelectSection<string>[] {
  const localeNames = new Map(locales.map((l) => [l.code, l.name]));
  const localeCodes = Object.keys(localeVersionGroups) as LocaleCode[];

  return [...localeCodes]
    .sort((a, b) => {
      if (a === locale) return -1;
      if (b === locale) return 1;
      return 0;
    })
    .map((localeCode) => ({
      label: localeNames.get(localeCode) ?? localeCode,
      options: localeVersionGroups[localeCode].map((value) => ({
        value,
        label: bibleVersionNames[value as keyof typeof bibleVersionNames],
      })),
    }));
}
