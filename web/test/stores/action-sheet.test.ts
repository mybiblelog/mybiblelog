import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useActionSheetStore } from '~/stores/action-sheet';

beforeEach(() => setActivePinia(createPinia()));

describe('action-sheet store', () => {
  it('opens with title and actions', () => {
    const store = useActionSheetStore();
    const actions = [{ label: 'Edit' }, { label: 'Delete' }];
    store.openSheet({ title: 'Options', actions });
    expect(store.open).toBe(true);
    expect(store.title).toBe('Options');
    expect(store.actions).toEqual(actions);
  });

  it('normalizes missing title and actions', () => {
    const store = useActionSheetStore();
    store.openSheet({});
    expect(store.title).toBeNull();
    expect(store.actions).toEqual([]);
  });

  it('closeSheet resets to defaults', () => {
    const store = useActionSheetStore();
    store.openSheet({ title: 'x', actions: [{ label: 'a' }] });
    store.closeSheet();
    expect(store.open).toBe(false);
    expect(store.title).toBeNull();
    expect(store.actions).toEqual([]);
  });
});
