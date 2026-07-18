import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useResolvedPassageNoteTags } from '~/composables/useResolvedPassageNoteTags';

type Tag = { id: string | number; label?: string; color?: string };

const state = vi.hoisted(() => ({ tags: [] as Tag[] }));

vi.mock('~/stores/passage-note-tags', () => ({
  usePassageNoteTagsStore: () => ({
    get passageNoteTags() { return state.tags; },
  }),
}));

beforeEach(() => {
  state.tags = [
    { id: '1', label: 'Faith', color: '#f00' },
    { id: '2', label: 'Hope', color: '#0f0' },
  ];
});

describe('useResolvedPassageNoteTags', () => {
  it('resolves known IDs to label/color from the store', () => {
    const resolved = useResolvedPassageNoteTags(() => ['1', '2']);
    expect(resolved.value).toEqual([
      { id: '1', label: 'Faith', color: '#f00' },
      { id: '2', label: 'Hope', color: '#0f0' },
    ]);
  });

  it('drops unknown IDs by default', () => {
    const resolved = useResolvedPassageNoteTags(() => ['1', '999']);
    expect(resolved.value.map(t => t.id)).toEqual(['1']);
  });

  it('keeps unknown IDs with the raw ID as label when keepUnknown is set', () => {
    const resolved = useResolvedPassageNoteTags(() => ['999'], { keepUnknown: true, defaultColor: 'gray' });
    expect(resolved.value).toEqual([{ id: '999', label: '999', color: 'gray' }]);
  });

  it('renders a placeholder for every ID while the tag set is empty', () => {
    state.tags = [];
    const resolved = useResolvedPassageNoteTags(() => ['1', '2'], { placeholderLabel: () => '…' });
    expect(resolved.value).toEqual([
      { id: '1', label: '…', color: 'var(--mbl-text-strong)' },
      { id: '2', label: '…', color: 'var(--mbl-text-strong)' },
    ]);
  });

  it('honours an explicit tags source over the store', () => {
    const tags = ref<Tag[]>([{ id: '7', label: 'Custom', color: '#00f' }]);
    const resolved = useResolvedPassageNoteTags(() => ['7'], { tags });
    expect(resolved.value).toEqual([{ id: '7', label: 'Custom', color: '#00f' }]);
  });
});
