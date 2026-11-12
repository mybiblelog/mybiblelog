// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import * as Vue from 'vue';
import { Bible, bookToPassage, computeGoalProgress, type ReadingGoal } from '@mybiblelog/shared';
import ReadingGoalCard from '~/components/goals/ReadingGoalCard.vue';
import { useUserSettingsStore } from '~/stores/user-settings';

const JUDE = 65;
const TOBIT = 67;
const SIRACH = 72;
const TODAY = '2026-01-02';

const goal = (books: number[]): ReadingGoal => ({
  id: 'g1',
  title: 'Goal',
  passages: books.map(bookToPassage),
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  active: true,
});

const readWholeBook = (book: number) => ({
  date: '2026-01-01',
  startVerseId: Bible.getFirstBookVerseId(book),
  endVerseId: Bible.getLastBookVerseId(book),
});

const mountCard = (books: number[], entries: ReturnType<typeof readWholeBook>[] = []) => {
  const g = goal(books);
  return mount(ReadingGoalCard, {
    props: { goal: g, progress: computeGoalProgress(g, entries, TODAY) },
    global: {
      stubs: { NuxtLink: { template: '<a><slot /></a>' } },
      mocks: { $n: (value: number) => String(value) },
    },
  });
};

const note = (wrapper: ReturnType<typeof mountCard>) => wrapper.find('[data-testid="reading-goal-card-outside-canon"]');

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00`));
  vi.stubGlobal('useI18n', () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    n: (value: number) => String(value),
    locale: Vue.ref('en'),
  }));
});

describe('ReadingGoalCard outside-canon notice', () => {
  it('is hidden while the reader includes deuterocanonical books', () => {
    useUserSettingsStore().settings.includeDeuterocanonical = true;
    expect(note(mountCard([TOBIT, JUDE])).exists()).toBe(false);
  });

  it('names unread deuterocanonical books once the reader excludes them', () => {
    useUserSettingsStore().settings.includeDeuterocanonical = false;
    const wrapper = mountCard([TOBIT, JUDE, SIRACH]);
    expect(note(wrapper).text()).toContain('Tobit and Sirach');
    expect(note(wrapper).text()).not.toContain('Jude');
  });

  it('is hidden when the deuterocanonical books are already read', () => {
    useUserSettingsStore().settings.includeDeuterocanonical = false;
    expect(note(mountCard([TOBIT, JUDE], [readWholeBook(TOBIT)])).exists()).toBe(false);
  });

  it('is hidden for goals of only common-canon books', () => {
    useUserSettingsStore().settings.includeDeuterocanonical = false;
    expect(note(mountCard([JUDE])).exists()).toBe(false);
  });

  it('appears and disappears as the setting changes', async () => {
    const settings = useUserSettingsStore().settings;
    settings.includeDeuterocanonical = true;
    const wrapper = mountCard([TOBIT]);
    expect(note(wrapper).exists()).toBe(false);

    settings.includeDeuterocanonical = false;
    await wrapper.vm.$nextTick();
    expect(note(wrapper).exists()).toBe(true);

    settings.includeDeuterocanonical = true;
    await wrapper.vm.$nextTick();
    expect(note(wrapper).exists()).toBe(false);
  });

  it('does not change the goal\'s totals or progress', () => {
    const settings = useUserSettingsStore().settings;
    settings.includeDeuterocanonical = false;
    const off = mountCard([TOBIT, JUDE], [readWholeBook(TOBIT)]).find('[data-testid="reading-goal-card-verses"]').text();
    settings.includeDeuterocanonical = true;
    const on = mountCard([TOBIT, JUDE], [readWholeBook(TOBIT)]).find('[data-testid="reading-goal-card-verses"]').text();
    expect(off).toBe(on);
    expect(off).toContain(String(Bible.getBookVerseCount(TOBIT)));
  });
});
