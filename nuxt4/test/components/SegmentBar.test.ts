// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SegmentBar from '~/components/bible/SegmentBar.vue';

const seg = (over: Record<string, unknown> = {}) => ({
  id: 1, startVerseId: 101001001, endVerseId: 101001002, percentage: 1, read: false, ...over,
});

describe('SegmentBar', () => {
  it('renders one element per segment', () => {
    const wrapper = mount(SegmentBar, {
      props: { segments: [seg({ id: 1 }), seg({ id: 2 }), seg({ id: 3 })] },
    });
    expect(wrapper.findAll('.segment')).toHaveLength(3);
  });

  it('marks read segments with the is-read class', () => {
    const wrapper = mount(SegmentBar, {
      props: { segments: [seg({ id: 1, read: true }), seg({ id: 2, read: false })] },
    });
    const segments = wrapper.findAll('.segment');
    expect(segments[0].classes()).toContain('is-read');
    expect(segments[1].classes()).not.toContain('is-read');
  });

  it('renders nothing in the bar when there are no segments', () => {
    const wrapper = mount(SegmentBar, { props: { segments: [] } });
    expect(wrapper.findAll('.segment')).toHaveLength(0);
  });

  it('applies thick height when thick=true', () => {
    const wrapper = mount(SegmentBar, { props: { segments: [], thick: true } });
    expect(wrapper.get('.segment-bar').attributes('style')).toContain('height: 1rem');
  });
});
