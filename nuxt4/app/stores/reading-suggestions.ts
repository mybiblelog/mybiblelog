import { defineStore } from 'pinia';
import dayjs from 'dayjs';
import {
  Bible,
  displayDaysSince,
  getReadingSuggestions,
  type ReadingSuggestionContext,
  type ReadingSuggestionPassage,
} from '@mybiblelog/shared';
import { useLogEntriesStore } from '~/stores/log-entries';

export type { ReadingSuggestionPassage };

const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

export type ReadingSuggestionsState = {
  passages: ReadingSuggestionPassage[];
};

export const useReadingSuggestionsStore = defineStore('reading-suggestions', {
  state: (): ReadingSuggestionsState => ({
    passages: [],
  }),
  actions: {
    refreshReadingSuggestions(): void {
      const nuxtApp = useNuxtApp();
      const $i18n = nuxtApp.$i18n as { locale: { value: string }; t: (key: string, params?: Record<string, unknown>) => string } | undefined;
      const locale = $i18n?.locale?.value || 'en';
      const t = (key: string, params?: Record<string, unknown>) => $i18n?.t(key, params) ?? key;

      const displayContext = (context: ReadingSuggestionContext): string => {
        if (context.kind === 'continue') {
          const message = t('reading_suggestion.date_you_read_passage', {
            display_date: displayDaysSince(context.lastRead.date, locale),
            passage: Bible.displayVerseRange(
              context.lastRead.startVerseId,
              context.lastRead.endVerseId,
              locale,
            ),
          });
          return capitalize(message);
        }
        switch (context.path) {
        case 'nt': return t('reading_suggestion.new_testament');
        case 'ot': return t('reading_suggestion.old_testament');
        case 'wisdom': return t('reading_suggestion.wisdom');
        }
      };

      const logEntries = useLogEntriesStore().currentLogEntries;
      const today = dayjs().format('YYYY-MM-DD');

      this.passages = getReadingSuggestions(logEntries, today).map(suggestion => ({
        startVerseId: suggestion.startVerseId,
        endVerseId: suggestion.endVerseId,
        suggestionContext: displayContext(suggestion.context),
      }));
    },
  },
});
