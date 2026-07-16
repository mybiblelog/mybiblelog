// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { Bible } from '@mybiblelog/shared';
import PassageInput from '~/components/forms/PassageInput.vue';
import PassagePickerModal from '~/components/forms/PassagePickerModal.vue';

const JOHN = 43;

const mountInput = (props: Record<string, unknown> = {}) =>
  mount(PassageInput, {
    props: { locale: 'en', inputTestId: 'test-passage', ...props },
    global: { stubs: { teleport: true } },
  });

const getInput = (wrapper: ReturnType<typeof mountInput>) =>
  wrapper.get('[data-testid="test-passage"]');

const lastModel = (wrapper: ReturnType<typeof mountInput>) =>
  wrapper.emitted('update:modelValue')!.at(-1)![0];

const lastValid = (wrapper: ReturnType<typeof mountInput>) =>
  wrapper.emitted('update:valid')!.at(-1)![0];

describe('PassageInput typed entry', () => {
  it('accepts just a book (whole book range)', async () => {
    const wrapper = mountInput();
    await getInput(wrapper).setValue('John');
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 1, 1),
      endVerseId: Bible.makeVerseId(JOHN, 21, 25),
    });
    expect(lastValid(wrapper)).toBe(true);
  });

  it('accepts a book and chapter (whole chapter range)', async () => {
    const wrapper = mountInput();
    await getInput(wrapper).setValue('John 3');
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 1),
      endVerseId: Bible.makeVerseId(JOHN, 3, Bible.getChapterVerseCount(JOHN, 3)),
    });
  });

  it('accepts a book, chapter, and verse', async () => {
    const wrapper = mountInput();
    await getInput(wrapper).setValue('John 3:16');
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 3, 16),
    });
  });

  it('accepts a book, chapter, and multiple verses', async () => {
    const wrapper = mountInput();
    await getInput(wrapper).setValue('John 3:16-18');
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 3, 18),
    });
  });

  it('accepts a book and multiple chapters (auto first and last verses)', async () => {
    const wrapper = mountInput();
    await getInput(wrapper).setValue('John 3-4');
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 1),
      endVerseId: Bible.makeVerseId(JOHN, 4, Bible.getChapterVerseCount(JOHN, 4)),
    });
  });

  it('accepts explicit verses across multiple chapters', async () => {
    const wrapper = mountInput();
    await getInput(wrapper).setValue('John 3:16-4:2');
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 4, 2),
    });
  });

  it('parses references in the locale given by the locale prop', async () => {
    const wrapper = mountInput({ locale: 'de' });
    await getInput(wrapper).setValue('Johannes 3');
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 1),
      endVerseId: Bible.makeVerseId(JOHN, 3, Bible.getChapterVerseCount(JOHN, 3)),
    });
  });
});

describe('PassageInput validity contract', () => {
  it('reports valid on mount when empty', () => {
    const wrapper = mountInput();
    expect(wrapper.emitted('update:valid')!.at(-1)![0]).toBe(true);
  });

  it('emits null and valid=false for invalid text, showing the error only after blur', async () => {
    const wrapper = mountInput();
    const input = getInput(wrapper);
    await input.trigger('focus');
    await input.setValue('Jonh 3');

    expect(lastModel(wrapper)).toBeNull();
    expect(lastValid(wrapper)).toBe(false);
    // Still editing: no visible error yet.
    expect(wrapper.find('.mbl-help--danger').exists()).toBe(false);

    await input.trigger('blur');
    expect(wrapper.find('.mbl-help--danger').exists()).toBe(true);
  });

  it('clears the error as soon as the text becomes valid again', async () => {
    const wrapper = mountInput();
    const input = getInput(wrapper);
    await input.trigger('focus');
    await input.setValue('Jonh 3');
    await input.trigger('blur');
    expect(wrapper.find('.mbl-help--danger').exists()).toBe(true);

    await input.trigger('focus');
    await input.setValue('John 3');
    expect(wrapper.find('.mbl-help--danger').exists()).toBe(false);
    expect(lastValid(wrapper)).toBe(true);
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 1),
      endVerseId: Bible.makeVerseId(JOHN, 3, Bible.getChapterVerseCount(JOHN, 3)),
    });
  });

  it('normalizes valid text to the canonical form on blur', async () => {
    const wrapper = mountInput();
    const input = getInput(wrapper);
    await input.trigger('focus');
    await input.setValue('jn 3:16');
    await input.trigger('blur');
    expect((input.element as HTMLInputElement).value).toBe('John 3:16');
  });

  it('clears the value and emits null when the clear button is pressed', async () => {
    const wrapper = mountInput();
    await getInput(wrapper).setValue('John 3:16');
    await wrapper.get('.passage-input__clear').trigger('click');
    expect(lastModel(wrapper)).toBeNull();
    expect(lastValid(wrapper)).toBe(true);
  });

  it('renders an incoming modelValue formatted for the locale prop', () => {
    const range = {
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 3, 18),
    };
    const en = mountInput({ modelValue: range });
    expect((getInput(en).element as HTMLInputElement).value).toBe('John 3:16-18');

    const de = mountInput({ modelValue: range, locale: 'de' });
    expect((getInput(de).element as HTMLInputElement).value).toBe('Johannes 3:16-18');
  });
});

describe('PassageInput autocomplete', () => {
  it('suggests locale-specific book names while typing', async () => {
    const en = mountInput();
    await getInput(en).trigger('focus');
    await getInput(en).setValue('gen');
    expect(en.get('[data-testid="test-passage-suggestions"]').text()).toContain('Genesis');

    const de = mountInput({ locale: 'de' });
    await getInput(de).trigger('focus');
    await getInput(de).setValue('joh');
    expect(de.get('[data-testid="test-passage-suggestions"]').text()).toContain('Johannes');
  });

  it('hides suggestions once the reference goes beyond the book name', async () => {
    const wrapper = mountInput();
    const input = getInput(wrapper);
    await input.trigger('focus');
    await input.setValue('Genesis');
    expect(wrapper.find('[data-testid="test-passage-suggestions"]').exists()).toBe(true);
    await input.setValue('Genesis 1');
    expect(wrapper.find('[data-testid="test-passage-suggestions"]').exists()).toBe(false);
  });

  it('fills the book on click and emits the whole-book range', async () => {
    const wrapper = mountInput();
    const input = getInput(wrapper);
    await input.trigger('focus');
    await input.setValue('gen');
    await wrapper.get('[data-testid="test-passage-suggestion-1"]').trigger('mousedown');

    expect((input.element as HTMLInputElement).value).toBe('Genesis ');
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 50, Bible.getChapterVerseCount(1, 50)),
    });
    // Filling closes the dropdown.
    expect(wrapper.find('[data-testid="test-passage-suggestions"]').exists()).toBe(false);
  });

  it('supports keyboard navigation: ArrowDown + Enter fills the active option', async () => {
    const wrapper = mountInput();
    const input = getInput(wrapper);
    await input.trigger('focus');
    await input.setValue('joh');
    await input.trigger('keydown', { key: 'ArrowDown' });
    await input.trigger('keydown', { key: 'Enter' });

    expect((input.element as HTMLInputElement).value).toBe('John ');
    expect(lastModel(wrapper)).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 1, 1),
      endVerseId: Bible.makeVerseId(JOHN, 21, 25),
    });
  });

  it('closes the dropdown on Escape', async () => {
    const wrapper = mountInput();
    const input = getInput(wrapper);
    await input.trigger('focus');
    await input.setValue('gen');
    await input.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[data-testid="test-passage-suggestions"]').exists()).toBe(false);
  });
});

describe('PassageInput picker flow', () => {
  it('opens the picker modal from the Pick button', async () => {
    const wrapper = mountInput();
    expect(wrapper.getComponent(PassagePickerModal).props('open')).toBe(false);
    await wrapper.get('.passage-input__pick-button').trigger('click');
    expect(wrapper.getComponent(PassagePickerModal).props('open')).toBe(true);
  });

  it('seeds the picker with the current value', () => {
    const range = {
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 3, 18),
    };
    const wrapper = mountInput({ modelValue: range });
    expect(wrapper.getComponent(PassagePickerModal).props('seed')).toEqual(range);
  });

  it('adopts picker changes: formats the text and emits the range', async () => {
    const wrapper = mountInput();
    const range = {
      startVerseId: Bible.makeVerseId(JOHN, 3, 1),
      endVerseId: Bible.makeVerseId(JOHN, 4, Bible.getChapterVerseCount(JOHN, 4)),
    };
    wrapper.getComponent(PassagePickerModal).vm.$emit('change', range);
    await nextTick();

    expect(lastModel(wrapper)).toEqual(range);
    expect((getInput(wrapper).element as HTMLInputElement).value).toBe('John 3-4');
    expect(lastValid(wrapper)).toBe(true);
  });
});
