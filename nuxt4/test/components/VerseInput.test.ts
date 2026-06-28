// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { Bible, formatVerseRange } from '@mybiblelog/shared';
import VerseInput from '~/components/forms/VerseInput.vue';

// John 3:16 as the component's own formatter would render it, so the parser
// round-trips it back to the same verse id.
const john316 = Bible.makeVerseId(43, 3, 16);
const john316Text = formatVerseRange({ startVerseId: john316, endVerseId: john316 }, 'en');

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
});
