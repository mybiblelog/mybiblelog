// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { Bible } from '@mybiblelog/shared';
import BookReport from '~/components/bible/BookReport.vue';
import ChapterReport from '~/components/bible/ChapterReport.vue';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';

// Genesis: index 1, 50 chapters, 1533 verses; chapter 1 has 31 verses.
const GENESIS = 1;

// A log entry covering all of Genesis 1 (31 of 1533 verses → floor(2.02%) = 2%).
const genesisChapterOneEntry = () => ({
  id: 1,
  date: '2020-01-01',
  startVerseId: Bible.makeVerseId(GENESIS, 1, 1),
  endVerseId: Bible.makeVerseId(GENESIS, 1, Bible.getChapterVerseCount(GENESIS, 1)),
});

let pushMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  setActivePinia(createPinia());

  pushMock = vi.fn();
  vi.stubGlobal('useRouter', () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }));
  vi.stubGlobal('useLocalePath', () => (path: string) => path);

  // The default `useI18n` stub has no `n` (number formatter); BookReport renders
  // the read percentage via `n(value, 'percent')`.
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    te: () => true,
    n: (value: number, format?: string) =>
      format === 'percent' ? `${Math.round(value * 100)}%` : String(value),
    locale: ref('en'),
    locales: ref([]),
  }));
});

const mountReport = (props: Record<string, unknown> = {}): VueWrapper =>
  mount(BookReport, { props });

describe('BookReport', () => {
  it('renders the book name in the header', () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    expect(wrapper.text()).toContain('Genesis');
  });

  it('defaults to Genesis (book index 1) when no bookIndex is given', () => {
    const wrapper = mountReport();
    expect(wrapper.text()).toContain('Genesis');
  });

  it('renders one ChapterReport per chapter in the book', () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    expect(wrapper.findAllComponents(ChapterReport)).toHaveLength(
      Bible.getBookChapterCount(GENESIS),
    );
  });

  it('shows 0% read when there are no log entries', () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    const plaque = wrapper.get('[data-testid="book-report-progress"]');
    expect(plaque.attributes('data-percentage')).toBe('0');
    expect(plaque.text()).toContain('0%');
  });

  it('computes the read percentage from the log entries', () => {
    const wrapper = mountReport({ bookIndex: GENESIS, logEntries: [genesisChapterOneEntry()] });
    // 31 of 1533 verses → Math.floor(2.02%) = 2
    const plaque = wrapper.get('[data-testid="book-report-progress"]');
    expect(plaque.attributes('data-percentage')).toBe('2');
    expect(plaque.text()).toContain('2%');
  });

  it('passes per-chapter read counts down to each ChapterReport', () => {
    const wrapper = mountReport({ bookIndex: GENESIS, logEntries: [genesisChapterOneEntry()] });
    const reports = wrapper.findAllComponents(ChapterReport);
    expect(reports[0].props('report')).toMatchObject({
      bookIndex: GENESIS,
      chapterIndex: 1,
      versesRead: 31,
      totalVerses: 31,
      percentage: 100,
    });
    // Chapter 2 is unread.
    expect(reports[1].props('report')).toMatchObject({
      chapterIndex: 2,
      versesRead: 0,
      percentage: 0,
    });
  });

  it('emits exit-book-report when the back button is clicked', async () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    await wrapper.findAll('.book-report-header__back')[0].trigger('click');
    expect(wrapper.emitted('exit-book-report')).toHaveLength(1);
  });

  it('emits view-book-notes when the notes button is clicked', async () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    await wrapper.findAll('.book-report-header__notes')[0].trigger('click');
    expect(wrapper.emitted('view-book-notes')).toHaveLength(1);
  });

  it('emits view-book-log when the reading button is clicked', async () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    await wrapper.findAll('.book-report-header__reading')[0].trigger('click');
    expect(wrapper.emitted('view-book-log')).toHaveLength(1);
  });

  it('opens the log entry editor for the full chapter on create-log-entry', () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    wrapper.findAllComponents(ChapterReport)[0].vm.$emit('createLogEntry', GENESIS, 2);

    const store = useLogEntryEditorStore();
    const verseCount = Bible.getChapterVerseCount(GENESIS, 2);
    expect(store.open).toBe(true);
    expect(store.logEntry).toMatchObject({
      startVerseId: Bible.makeVerseId(GENESIS, 2, 1),
      endVerseId: Bible.makeVerseId(GENESIS, 2, verseCount),
    });
  });

  it('opens the passage note editor for the full chapter on take-note-on-chapter', () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    wrapper.findAllComponents(ChapterReport)[0].vm.$emit('takeNoteOnChapter', GENESIS, 2);

    const store = usePassageNoteEditorStore();
    const verseCount = Bible.getChapterVerseCount(GENESIS, 2);
    expect(store.open).toBe(true);
    expect(store.passageNote.passages[0]).toMatchObject({
      startVerseId: Bible.makeVerseId(GENESIS, 2, 1),
      endVerseId: Bible.makeVerseId(GENESIS, 2, verseCount),
    });
  });

  it('navigates to the notes page filtered to the chapter on view-notes-for-chapter', () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    wrapper.findAllComponents(ChapterReport)[0].vm.$emit('viewNotesForChapter', GENESIS, 2);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0][0]).toMatchObject({ path: '/notes' });
  });

  it('navigates to the log page filtered to the chapter on view-reading-log-for-chapter', () => {
    const wrapper = mountReport({ bookIndex: GENESIS });
    wrapper.findAllComponents(ChapterReport)[0].vm.$emit('viewReadingLogForChapter', GENESIS, 2);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0][0]).toMatchObject({ path: '/log' });
  });
});
