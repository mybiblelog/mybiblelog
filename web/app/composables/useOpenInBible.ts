import { Bible } from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useJustOpenedStore } from '~/stores/just-opened';

/**
 * Opens the user's preferred Bible reading site in a new tab, then prompts
 * the user to log their reading when they return to the app.
 */
export function useOpenInBible() {
  const userSettingsStore = useUserSettingsStore();
  const justOpenedStore = useJustOpenedStore();

  function openReadingUrl(bookIndex: number, chapterIndex: number) {
    const url = userSettingsStore.getReadingUrl(bookIndex, chapterIndex);
    window.open(url, '_blank');
  }

  function openChapterInBible(bookIndex: number, chapterIndex: number) {
    openReadingUrl(bookIndex, chapterIndex);
    const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
    justOpenedStore.openPrompt(
      Bible.makeVerseId(bookIndex, chapterIndex, 1),
      Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount),
    );
  }

  function openPassageInBible(passage: { startVerseId: number; endVerseId: number }) {
    const { book, chapter } = Bible.parseVerseId(passage.startVerseId);
    openReadingUrl(book, chapter);
    justOpenedStore.openPrompt(passage.startVerseId, passage.endVerseId);
  }

  return { openChapterInBible, openPassageInBible };
}
