import { defineStore } from 'pinia';
import dayjs from 'dayjs';
import { Bible, displayDaysSince } from '@mybiblelog/shared';
import { useLogEntriesStore } from '~/stores/log-entries';
import {
  type ReadingSuggestionPassage,
  getRecentDates,
  getLastLogEntryPerBook,
  filterSuggestionsOverlappingPassages,
  getReadingPathSuggestions,
} from '~/helpers/reading-suggestions';

export type { ReadingSuggestionPassage };

type RecentReadingSuggestion = ReadingSuggestionPassage & {
  suggestionContext: string;
  date: string; // YYYY-MM-DD (for sorting)
};

const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

export type ReadingSuggestionsState = {
  passages: ReadingSuggestionPassage[];
};

type I18nLike = {
  locale: string;
  t: (key: string, params?: Record<string, unknown>) => string;
};

export const useReadingSuggestionsStore = defineStore('reading-suggestions', {
  state: (): ReadingSuggestionsState => ({
    passages: [],
  }),
  actions: {
    refreshReadingSuggestions(): void {
      const i18n = (this as unknown as { $i18n?: I18nLike }).$i18n;
      const locale = i18n?.locale || 'en';

      const logEntries = useLogEntriesStore().currentLogEntries;

      const suggestionCount = 3;
      const suggestions: ReadingSuggestionPassage[] = [];

      // Get last X dates in format 'YYYY-MM-DD'
      const readingDaysToLookBack = 3;
      const dates = getRecentDates(readingDaysToLookBack);

      // Filter to recent log entries and cap at readingDaysToLookBack distinct dates
      let recentReadingLogEntries = [...logEntries].filter(entry => dates.includes(entry.date));
      recentReadingLogEntries.sort((a, b) => b.date.localeCompare(a.date));
      const datesRead: string[] = [];
      for (let i = 0; i < recentReadingLogEntries.length; i++) {
        const entryDate = recentReadingLogEntries[i].date;
        if (!datesRead.includes(entryDate)) {
          if (datesRead.length === readingDaysToLookBack) {
            recentReadingLogEntries = recentReadingLogEntries.slice(0, i);
            break;
          }
          datesRead.push(entryDate);
        }
      }

      const lastLogEntryPerBook = getLastLogEntryPerBook(recentReadingLogEntries);

      const allRecentReadingSuggestions: RecentReadingSuggestion[] = [];
      for (const bookIndexStr of Object.keys(lastLogEntryPerBook)) {
        const bookIndex = Number(bookIndexStr);
        const lastBookLogEntry = lastLogEntryPerBook[bookIndex];
        const nextVerseId = Bible.getNextVerseId(lastBookLogEntry.endVerseId);
        if (nextVerseId) {
          const nextVerseChapter = Bible.parseVerseId(nextVerseId).chapter;
          const endVerseId = Bible.getLastBookChapterVerseId(bookIndex, nextVerseChapter);

          const lastBookLogEntryDisplayText = Bible.displayVerseRange(
            lastBookLogEntry.startVerseId,
            lastBookLogEntry.endVerseId,
            locale,
          );
          const lastBookLogEntryDisplayDate = displayDaysSince(lastBookLogEntry.date, locale);

          const suggestionContextMessage = i18n?.t
            ? i18n.t('reading_suggestion.date_you_read_passage', {
              display_date: lastBookLogEntryDisplayDate,
              passage: lastBookLogEntryDisplayText,
            })
            : `You read ${lastBookLogEntryDisplayText} ${lastBookLogEntryDisplayDate}`;

          allRecentReadingSuggestions.push({
            startVerseId: nextVerseId,
            endVerseId,
            suggestionContext: capitalize(suggestionContextMessage),
            date: lastBookLogEntry.date,
          });
        }
      }

      // Filter out suggestions that overlap today's log entries
      const todayDate = dayjs().format('YYYY-MM-DD');
      const todayLogEntries = logEntries.filter(entry => entry.date === todayDate);
      const filteredRecentSuggestions = filterSuggestionsOverlappingPassages(
        allRecentReadingSuggestions,
        todayLogEntries,
      );

      // Sort by date, newest first, strip the sort key, and add to suggestions
      const sortedRecentReadingSuggestions: ReadingSuggestionPassage[] = filteredRecentSuggestions
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(({ date: _date, ...rest }) => rest);

      suggestions.push(...sortedRecentReadingSuggestions.slice(0, suggestionCount));

      // Each reading path is a separate lineup of books to be read in sequence.
      const readingPathNT = [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66];
      const readingPathOT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
      const readingPathWisdom = [19, 20, 21, 18, 22];

      const readingPathContextNT = i18n?.t ? i18n.t('reading_suggestion.new_testament') : 'New Testament';
      const readingPathContextOT = i18n?.t ? i18n.t('reading_suggestion.old_testament') : 'Old Testament';
      const readingPathContextWisdom = i18n?.t ? i18n.t('reading_suggestion.wisdom') : 'Wisdom';

      const suggestionsNT = getReadingPathSuggestions(readingPathNT, logEntries);
      const suggestionsOT = getReadingPathSuggestions(readingPathOT, logEntries);
      const suggestionsWisdom = getReadingPathSuggestions(readingPathWisdom, logEntries);
      suggestionsNT.forEach((s) => { s.suggestionContext = readingPathContextNT; });
      suggestionsOT.forEach((s) => { s.suggestionContext = readingPathContextOT; });
      suggestionsWisdom.forEach((s) => { s.suggestionContext = readingPathContextWisdom; });

      // Pull suggestions evenly from all reading paths
      const sources: ReadingSuggestionPassage[][] = [suggestionsNT, suggestionsOT, suggestionsWisdom]
        .filter(source => source.length > 0);
      let sourceIndex = 0;

      while (suggestions.length < suggestionCount) {
        if (!sources.length) { break; }

        const nextSuggestion = sources[sourceIndex].shift();
        if (!nextSuggestion) {
          sources.splice(sourceIndex, 1);
          sourceIndex = Math.min(sourceIndex, sources.length - 1);
          continue;
        }

        const rangeIsRedundant = suggestions.some(s => Bible.checkRangeOverlap(nextSuggestion, s));
        if (!rangeIsRedundant) {
          suggestions.push(nextSuggestion);
        }

        if (!sources[sourceIndex].length) {
          sources.splice(sourceIndex, 1);
        }
        else {
          sourceIndex++;
        }

        if (sourceIndex >= sources.length) {
          sourceIndex = 0;
        }
      }

      this.passages = suggestions;
    },
  },
});
