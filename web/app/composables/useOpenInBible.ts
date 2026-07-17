import { Bible } from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';

/**
 * Opens the user's preferred Bible reading site in a new tab.
 */
export function useOpenInBible() {
  const userSettingsStore = useUserSettingsStore();

  function openChapterInBible(bookIndex: number, chapterIndex: number) {
    const url = userSettingsStore.getReadingUrl(bookIndex, chapterIndex);
    window.open(url, '_blank');
  }

  function openPassageInBible(passage: { startVerseId: number }) {
    const { book, chapter } = Bible.parseVerseId(passage.startVerseId);
    openChapterInBible(book, chapter);
  }

  return { openChapterInBible, openPassageInBible };
}
