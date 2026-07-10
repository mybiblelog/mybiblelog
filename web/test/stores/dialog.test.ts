import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDialogStore } from '~/stores/dialog';

beforeEach(() => setActivePinia(createPinia()));

describe('dialog store', () => {
  it('alert opens an alert dialog and resolves when closed', async () => {
    const store = useDialogStore();
    const promise = store.alert({ title: 'Heads up', message: 'hello' });
    expect(store.open).toBe(true);
    expect(store.type).toBe('alert');
    expect(store.title).toBe('Heads up');
    expect(store.message).toBe('hello');

    store.closeAlert();
    await expect(promise).resolves.toBeUndefined();
    expect(store.open).toBe(false);
    expect(store.type).toBe('');
  });

  it('confirm resolves true when accepted', async () => {
    const store = useDialogStore();
    const promise = store.confirm({ message: 'sure?' });
    expect(store.open).toBe(true);
    expect(store.type).toBe('confirm');

    store.acceptConfirm();
    await expect(promise).resolves.toBe(true);
    expect(store.open).toBe(false);
  });

  it('confirm resolves false when cancelled', async () => {
    const store = useDialogStore();
    const promise = store.confirm({ message: 'sure?' });
    store.cancelConfirm();
    await expect(promise).resolves.toBe(false);
  });

  it('defaults button types to primary', () => {
    const store = useDialogStore();
    store.alert({});
    expect(store.buttonType).toBe('primary');
  });
});
