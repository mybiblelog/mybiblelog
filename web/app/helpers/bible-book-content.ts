import { Bible } from '@mybiblelog/shared';
import bibleBookGuides from '~/helpers/bible-book-guides';

// One overview file per locale, code-split so a visitor only downloads their own language.
const overviewLoaders = import.meta.glob<{ default: readonly string[] }>('./bible-book-overviews/*.ts');

/** Overview prose for all 66 books (index 0 = Genesis) in the given locale, falling back to English. */
export const loadBookOverviews = async (locale: string): Promise<readonly string[]> => {
  const load = overviewLoaders[`./bible-book-overviews/${locale}.ts`] ?? overviewLoaders['./bible-book-overviews/en.ts']!;
  return (await load()).default;
};

// Singular "Psalm" is what people say for a single psalm ("Psalm 23"); Bible.getBookName gives the book title ("Psalms").
const psalmSingular: Record<string, string> = {
  en: 'Psalm',
  de: 'Psalm',
  es: 'Salmo',
  fr: 'Psaume',
  pt: 'Salmo',
  uk: 'Псалом',
  ko: '시편',
};

const PSALMS = 19;

/** e.g. "Genesis 1:1–2:3", "Psalm 23", "창세기 1:1–2:3", in the given locale. */
export const formatKeyPassage = (bookIndex: number, ref: string, locale: string): string => {
  const isSinglePsalm = bookIndex === PSALMS && /^\d+$/.test(ref);
  const name = isSinglePsalm ? (psalmSingular[locale] ?? psalmSingular.en!) : Bible.getBookName(bookIndex, locale);
  return `${name} ${ref}`;
};

export const getBookGuide = (bookIndex: number) => bibleBookGuides[bookIndex - 1];
