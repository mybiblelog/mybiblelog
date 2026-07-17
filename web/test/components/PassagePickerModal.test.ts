// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { Bible } from '@mybiblelog/shared';
import PassagePickerModal from '~/components/forms/PassagePickerModal.vue';
import GridSelector from '~/components/forms/GridSelector.vue';
import TapRangeSelector from '~/components/forms/TapRangeSelector.vue';

const JOHN = 43;
const JUDE = 65; // single chapter

const mountPicker = (props: Record<string, unknown> = {}) =>
  mount(PassagePickerModal, {
    props: { open: true, locale: 'en', ...props },
    global: { stubs: { teleport: true } },
  });

const pickBook = async (wrapper: VueWrapper, book: number) => {
  wrapper.getComponent(GridSelector).vm.$emit('selection', book);
  await nextTick();
};

const tap = async (wrapper: VueWrapper, value: number) => {
  wrapper.getComponent(TapRangeSelector).vm.$emit('selection', { from: value, to: value });
  await nextTick();
};

const skip = async (wrapper: VueWrapper) => {
  await wrapper.get('[data-testid="passage-picker-skip"]').trigger('click');
};

const lastChange = (wrapper: VueWrapper) =>
  wrapper.emitted('change')!.at(-1)![0];

describe('PassagePickerModal', () => {
  it('emits the whole book after picking a book', async () => {
    const wrapper = mountPicker();
    await pickBook(wrapper, JOHN);
    expect(lastChange(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 1, 1),
      endVerseId: Bible.makeVerseId(JOHN, 21, 25),
    });
  });

  it('auto-selects verse 1, the same end chapter, and its last verse on a single chapter tap', async () => {
    const wrapper = mountPicker();
    await pickBook(wrapper, JOHN);
    await tap(wrapper, 3);
    expect(lastChange(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 1),
      endVerseId: Bible.makeVerseId(JOHN, 3, Bible.getChapterVerseCount(JOHN, 3)),
    });
  });

  it('selects a single chapter with custom verses (skip end chapter)', async () => {
    const wrapper = mountPicker();
    await pickBook(wrapper, JOHN);
    await tap(wrapper, 3); // start chapter
    await skip(wrapper); // keep end chapter = 3
    await tap(wrapper, 16); // start verse
    await tap(wrapper, 18); // end verse
    expect(lastChange(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 3, 18),
    });
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('selects multiple chapters with auto start and end verses', async () => {
    const wrapper = mountPicker();
    await pickBook(wrapper, JOHN);
    await tap(wrapper, 3);
    await tap(wrapper, 4); // end chapter
    await skip(wrapper); // keep verse 1
    await skip(wrapper); // keep last verse
    expect(lastChange(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 1),
      endVerseId: Bible.makeVerseId(JOHN, 4, Bible.getChapterVerseCount(JOHN, 4)),
    });
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('selects multiple chapters with a specific start verse and auto end verse', async () => {
    const wrapper = mountPicker();
    await pickBook(wrapper, JOHN);
    await tap(wrapper, 3);
    await tap(wrapper, 4);
    await tap(wrapper, 16); // start verse
    await skip(wrapper); // keep last verse
    expect(lastChange(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 4, Bible.getChapterVerseCount(JOHN, 4)),
    });
  });

  it('selects multiple chapters with an auto start verse and specific end verse', async () => {
    const wrapper = mountPicker();
    await pickBook(wrapper, JOHN);
    await tap(wrapper, 3);
    await tap(wrapper, 4);
    await skip(wrapper); // keep verse 1
    await tap(wrapper, 20); // end verse
    expect(lastChange(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 1),
      endVerseId: Bible.makeVerseId(JOHN, 4, 20),
    });
  });

  it('selects multiple chapters with custom start and end verses', async () => {
    const wrapper = mountPicker();
    await pickBook(wrapper, JOHN);
    await tap(wrapper, 3);
    await tap(wrapper, 4);
    await tap(wrapper, 16);
    await tap(wrapper, 20);
    expect(lastChange(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 4, 20),
    });
  });

  it('prevents an end verse before the start verse within a single chapter', async () => {
    const wrapper = mountPicker();
    await pickBook(wrapper, JOHN);
    await tap(wrapper, 3);
    await skip(wrapper); // keep end chapter = 3
    await tap(wrapper, 16); // start verse
    // End verse options may not precede the start verse in the same chapter.
    expect(wrapper.getComponent(TapRangeSelector).props('min')).toBe(16);
  });

  it('skips the chapter steps for a single-chapter book', async () => {
    const wrapper = mountPicker();
    await pickBook(wrapper, JUDE);
    expect(lastChange(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JUDE, 1, 1),
      endVerseId: Bible.makeVerseId(JUDE, 1, Bible.getChapterVerseCount(JUDE, 1)),
    });
    // Straight to the start verse step.
    await tap(wrapper, 3);
    await tap(wrapper, 5);
    expect(lastChange(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JUDE, 1, 3),
      endVerseId: Bible.makeVerseId(JUDE, 1, 5),
    });
  });

  it('hydrates from a seed without emitting, restarting at the book step', async () => {
    const wrapper = mount(PassagePickerModal, {
      props: {
        open: false,
        locale: 'en',
        seed: {
          startVerseId: Bible.makeVerseId(JOHN, 3, 16),
          endVerseId: Bible.makeVerseId(JOHN, 3, 18),
        },
      },
      global: { stubs: { teleport: true } },
    });
    await wrapper.setProps({ open: true });
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.findComponent(GridSelector).exists()).toBe(true);
  });

  it('localizes book options by the locale prop', () => {
    const wrapper = mountPicker({ locale: 'fr' });
    const labels = wrapper.getComponent(GridSelector).props('options')!.map(o => o.label);
    expect(labels).toContain('Genèse');
  });
});
