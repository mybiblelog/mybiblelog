import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia, defineStore } from 'pinia';
import { createModalStore } from '~/helpers/create-modal-store';

beforeEach(() => setActivePinia(createPinia()));

type Payload = { title: string | null; value: number };

function makeStore() {
  const blocks = createModalStore<Payload>({ title: null, value: 0 });
  return defineStore('test-modal', { state: blocks.state, actions: { ...blocks.actions } })();
}

describe('createModalStore', () => {
  it('starts closed with the initial payload', () => {
    const store = makeStore();
    expect(store.open).toBe(false);
    expect(store.title).toBeNull();
    expect(store.value).toBe(0);
  });

  it('openModal applies the payload and flips open', () => {
    const store = makeStore();
    store.openModal({ title: 'Hello', value: 5 });
    expect(store.open).toBe(true);
    expect(store.title).toBe('Hello');
    expect(store.value).toBe(5);
  });

  it('openModal resets omitted fields back to the initial payload', () => {
    const store = makeStore();
    store.openModal({ title: 'a', value: 9 });
    store.openModal({ title: 'b' });
    expect(store.title).toBe('b');
    expect(store.value).toBe(0);
  });

  it('closeModal resets everything to defaults', () => {
    const store = makeStore();
    store.openModal({ title: 'a', value: 9 });
    store.closeModal();
    expect(store.open).toBe(false);
    expect(store.title).toBeNull();
    expect(store.value).toBe(0);
  });
});
