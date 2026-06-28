// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PassageNoteTagPill from '~/components/notes/PassageNoteTagPill.vue';

describe('PassageNoteTagPill', () => {
  it('renders the tag label and background color', () => {
    const wrapper = mount(PassageNoteTagPill, {
      props: { tag: { id: 1, label: 'Grace', color: '#ff0000' } },
    });
    expect(wrapper.text()).toBe('Grace');
    expect(wrapper.get('.passage-note-tag-pill').attributes('style')).toContain('background-color: #ff0000');
  });
});
