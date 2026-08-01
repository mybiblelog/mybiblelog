// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { Bible } from '@mybiblelog/shared';
import PassageSelector from '~/components/forms/PassageSelector.vue';
import GridSelector from '~/components/forms/GridSelector.vue';
import TapRangeSelector from '~/components/forms/TapRangeSelector.vue';

const JOHN = 43;

// Drives a step of the modal wizard: emit the selection from whichever picker
// is currently rendered.
async function selectBook(wrapper: ReturnType<typeof mount>, book: number) {
  await wrapper.findComponent(GridSelector).vm.$emit('selection', book);
  await wrapper.vm.$nextTick();
}

async function tapRange(wrapper: ReturnType<typeof mount>, from: number, to: number) {
  await wrapper.findComponent(TapRangeSelector).vm.$emit('selection', { from, to });
  await wrapper.vm.$nextTick();
}

describe('PassageSelector auto-advance mode', () => {
  it('chains book → chapters → verses within the modal instead of exiting after the book', async () => {
    const wrapper = mount(PassageSelector, { props: { autoAdvance: true } });
    (wrapper.vm as unknown as { openSelectBook: () => void }).openSelectBook();
    await wrapper.vm.$nextTick();

    // Book step is showing; picking a multi-chapter book must advance to
    // chapters rather than close the modal.
    expect(wrapper.findComponent(GridSelector).exists()).toBe(true);
    await selectBook(wrapper, JOHN);
    expect(wrapper.findComponent(GridSelector).exists()).toBe(false);
    expect(wrapper.findComponent(TapRangeSelector).exists()).toBe(true);

    // Single chapter → advance to the verse-range step.
    await tapRange(wrapper, 3, 3);
    expect(wrapper.findComponent(TapRangeSelector).exists()).toBe(true);

    // Pick the verse range; the wizard resolves and emits the final range.
    await tapRange(wrapper, 16, 18);
    const emitted = wrapper.emitted('change');
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 3, 18),
    });
  });

  it('walks a multi-chapter range through start and end verse steps', async () => {
    const wrapper = mount(PassageSelector, { props: { autoAdvance: true } });
    (wrapper.vm as unknown as { openSelectBook: () => void }).openSelectBook();
    await wrapper.vm.$nextTick();

    await selectBook(wrapper, JOHN);
    await tapRange(wrapper, 3, 4); // chapters 3 → 4
    await tapRange(wrapper, 16, 16); // start verse (John 3:16)
    await tapRange(wrapper, 2, 2); // end verse (John 4:2)

    const emitted = wrapper.emitted('change');
    expect(emitted!.at(-1)![0]).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 4, 2),
    });
  });

  it('without auto-advance, closes the modal after each selection (chip-driven flow)', async () => {
    const wrapper = mount(PassageSelector);
    (wrapper.vm as unknown as { openSelectBook: () => void }).openSelectBook();
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(GridSelector).exists()).toBe(true);
    await selectBook(wrapper, JOHN);
    // Modal closes; no picker is shown until the user clicks the next chip.
    expect(wrapper.findComponent(GridSelector).exists()).toBe(false);
    expect(wrapper.findComponent(TapRangeSelector).exists()).toBe(false);
  });
});
