// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { Bible, formatVerseRange } from '@mybiblelog/shared';
import VerseInput from '~/components/forms/VerseInput.vue';
import GridSelector from '~/components/forms/GridSelector.vue';
import TapRangeSelector from '~/components/forms/TapRangeSelector.vue';
import PassageSelector from '~/components/forms/PassageSelector.vue';

// John 3:16 as the component's own formatter would render it, so the parser
// round-trips it back to the same verse id.
const john316 = Bible.makeVerseId(43, 3, 16);
const john316Text = formatVerseRange({ startVerseId: john316, endVerseId: john316 }, 'en');

// John 3:16-18 for exercising multi-verse ranges.
const john316to18Start = Bible.makeVerseId(43, 3, 16);
const john316to18End = Bible.makeVerseId(43, 3, 18);
const john316to18Text = formatVerseRange(
  { startVerseId: john316to18Start, endVerseId: john316to18End },
  'en',
);

describe('VerseInput (single-verse mode)', () => {
  it('emits update:modelValue with the parsed verse id on valid input', async () => {
    const wrapper = mount(VerseInput);
    const input = wrapper.get('input.verse-input__input');
    await input.setValue(john316Text);

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual({ startVerseId: john316, endVerseId: john316 });
  });

  it('shows an invalid hint and emits no range for unparseable input', async () => {
    const wrapper = mount(VerseInput);
    await wrapper.get('input.verse-input__input').setValue('not a verse');
    expect(wrapper.find('.verse-input__help').exists()).toBe(true);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('clears the value and emits null when the clear button is pressed', async () => {
    const wrapper = mount(VerseInput);
    await wrapper.get('input.verse-input__input').setValue(john316Text);
    await wrapper.get('.verse-input__clear').trigger('click');
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBeNull();
  });

  it('emits enter on Enter keydown once the text is a valid reference', async () => {
    const wrapper = mount(VerseInput);
    const input = wrapper.get('input.verse-input__input');
    await input.setValue(john316Text);
    await input.trigger('keydown.enter');
    expect(wrapper.emitted('enter')).toBeTruthy();
  });

  it('does not emit enter on Enter keydown while the text is invalid', async () => {
    const wrapper = mount(VerseInput);
    const input = wrapper.get('input.verse-input__input');
    await input.setValue('not a verse');
    await input.trigger('keydown.enter');
    expect(wrapper.emitted('enter')).toBeUndefined();
  });

  it('emits enter on Enter keydown when the field is empty', async () => {
    const wrapper = mount(VerseInput);
    const input = wrapper.get('input.verse-input__input');
    await input.trigger('keydown.enter');
    expect(wrapper.emitted('enter')).toBeTruthy();
  });
});

describe('VerseInput (multi-verse mode)', () => {
  it('emits update:modelValue with the parsed range on valid multi-verse input', async () => {
    const wrapper = mount(VerseInput, { props: { multiVerse: true } });
    const input = wrapper.get('input.verse-input__input');
    await input.setValue(john316to18Text);

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual({ startVerseId: john316to18Start, endVerseId: john316to18End });
  });

  it('shows the multi invalid-hint copy for unparseable input', async () => {
    const wrapper = mount(VerseInput, { props: { multiVerse: true } });
    await wrapper.get('input.verse-input__input').setValue('not a verse');
    expect(wrapper.find('.verse-input__help').exists()).toBe(true);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('applies the range emitted by the passage selector change handler', async () => {
    const wrapper = mount(VerseInput, { props: { multiVerse: true } });

    const passageSelector = wrapper.findComponent(PassageSelector);
    expect(passageSelector.exists()).toBe(true);
    await passageSelector.vm.$emit('change', { startVerseId: john316to18Start, endVerseId: john316to18End });

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual({ startVerseId: john316to18Start, endVerseId: john316to18End });
    expect((wrapper.get('input.verse-input__input').element as HTMLInputElement).value).toBe(john316to18Text);
  });
});

describe('VerseInput (single-verse picker flow)', () => {
  it('walks book -> chapter -> verse and emits the finalized verse id', async () => {
    const wrapper = mount(VerseInput, { global: { stubs: { teleport: true } } });

    await wrapper.get('.verse-input__pick-button').trigger('click');
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true);

    // Book step: John is bookIndex 43.
    await wrapper.findComponent(GridSelector).vm.$emit('selection', 43);

    // Chapter step: chapter 3.
    await wrapper.findComponent(TapRangeSelector).vm.$emit('selection', { from: 3, to: 3 });

    // Verse step: verse 16.
    await wrapper.findComponent(TapRangeSelector).vm.$emit('selection', { from: 16, to: 16 });

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual({ startVerseId: john316, endVerseId: john316 });

    // Modal closes after finalizing the selection.
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false);
    expect((wrapper.get('input.verse-input__input').element as HTMLInputElement).value).toBe(john316Text);
  });

  it('closes the modal without emitting when the picker is dismissed mid-flow', async () => {
    const wrapper = mount(VerseInput, { global: { stubs: { teleport: true } } });

    await wrapper.get('.verse-input__pick-button').trigger('click');
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true);

    await wrapper.get('[data-testid="modal-close"]').trigger('click');

    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});

describe('VerseInput (multi-verse mode, additional cases)', () => {
  it('emits a single-verse range as-is when start and end match', async () => {
    const wrapper = mount(VerseInput, { props: { multiVerse: true } });
    const input = wrapper.get('input.verse-input__input');
    await input.setValue(john316Text);

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted!.at(-1)![0]).toEqual({ startVerseId: john316, endVerseId: john316 });
  });

  it('shows a multi-verse-specific invalid hint (distinct from single-verse mode) for unparseable input', async () => {
    const single = mount(VerseInput, { props: { multiVerse: false } });
    await single.get('input.verse-input__input').setValue('not a verse');
    const singleHelpKey = single.get('.verse-input__help').text();

    const multi = mount(VerseInput, { props: { multiVerse: true } });
    await multi.get('input.verse-input__input').setValue('not a verse');
    const multiHelp = multi.find('.verse-input__help');
    expect(multiHelp.exists()).toBe(true);
    expect(multiHelp.text()).not.toEqual(singleHelpKey);
    expect(multi.emitted('update:modelValue')).toBeUndefined();
  });

  it('uses a multi-verse example placeholder distinct from single-verse mode', () => {
    const single = mount(VerseInput, { props: { multiVerse: false } });
    const multi = mount(VerseInput, { props: { multiVerse: true } });
    const singlePlaceholder = single.get('input.verse-input__input').attributes('placeholder');
    const multiPlaceholder = multi.get('input.verse-input__input').attributes('placeholder');
    expect(multiPlaceholder).not.toEqual(singlePlaceholder);
    expect(multiPlaceholder).toContain(john316to18Text);
  });
});
