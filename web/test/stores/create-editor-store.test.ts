import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia, defineStore } from 'pinia';
import { createEditorStore } from '~/helpers/create-editor-store';
import type { EditorStoreConfig } from '~/helpers/create-editor-store';
import { useDialogStore } from '~/stores/dialog';
import { ApiError } from '~/helpers/api-error';

beforeEach(() => setActivePinia(createPinia()));

type Model = { id: number | null; name: string };
type Payload = Partial<Model> | null | undefined;

const empty = (): Model => ({ id: null, name: '' });

function makeValidatedStore(overrides: Partial<EditorStoreConfig<Model, Model, Payload>> = {}) {
  const blocks = createEditorStore<Model, Model, Payload>({
    empty,
    build: overrides.build ?? (payload => ({ ...empty(), ...(payload ?? {}) })),
    save: overrides.save ?? ((model): Promise<Model | null> => Promise.resolve({ ...model, id: 1 })),
    validate: overrides.validate ?? (model => model.name.length > 0),
  });
  return defineStore('test-editor', { state: blocks.state, actions: { ...blocks.actions } })();
}

describe('createEditorStore', () => {
  it('openEditor builds the model, snapshots clean value, and derives validity', () => {
    const store = makeValidatedStore();
    store.openEditor({ name: 'hi' });

    expect(store.open).toBe(true);
    expect(store.model).toEqual({ id: null, name: 'hi' });
    expect(store.isValid).toBe(true);
    expect(store.errors).toEqual({});
  });

  it('updateModel re-derives validity', () => {
    const store = makeValidatedStore();
    store.openEditor(null);
    expect(store.isValid).toBe(false);

    store.updateModel({ id: null, name: 'x' });
    expect(store.isValid).toBe(true);
  });

  it('save resets and returns the result on success', async () => {
    const save = vi.fn((model: Model): Promise<Model | null> => Promise.resolve({ ...model, id: 7 }));
    const store = makeValidatedStore({ save });
    store.openEditor({ name: 'a' });

    const result = await store.save();

    expect(result).toEqual({ id: 7, name: 'a' });
    expect(store.open).toBe(false);
    expect(store.submitting).toBe(false);
  });

  it('save never throws: it maps errors and returns null on failure', async () => {
    const save = vi.fn((): Promise<Model | null> =>
      Promise.reject(new ApiError({ code: 'validation', errors: [{ field: 'name', code: 'required' }] })),
    );
    const store = makeValidatedStore({ save });
    store.openEditor({ name: 'a' });

    const result = await store.save();

    expect(result).toBeNull();
    expect(store.errors.name).toEqual({ field: 'name', code: 'required' });
    expect(store.submitting).toBe(false);
  });

  it('ignores a second save while one is in flight', () => {
    const save = vi.fn(() => new Promise<Model | null>(() => {}));
    const store = makeValidatedStore({ save });
    store.openEditor({ name: 'a' });

    void store.save();
    void store.save();

    expect(store.submitting).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('closeEditor resets without prompting when the form is clean', async () => {
    const store = makeValidatedStore();
    store.openEditor({ name: 'a' });

    const ok = await store.closeEditor();

    expect(ok).toBe(true);
    expect(store.open).toBe(false);
    expect(useDialogStore().open).toBe(false);
  });

  it('closeEditor prompts when dirty and stays open if the user cancels', async () => {
    const store = makeValidatedStore();
    store.openEditor({ name: 'a' });
    store.updateModel({ id: null, name: 'changed' });

    const dialog = useDialogStore();
    const promise = store.closeEditor();
    expect(dialog.open).toBe(true);

    dialog.cancelConfirm();
    const ok = await promise;

    expect(ok).toBe(false);
    expect(store.open).toBe(true);
  });

  it('closeEditor with force skips the confirm even when dirty', async () => {
    const store = makeValidatedStore();
    store.openEditor({ name: 'a' });
    store.updateModel({ id: null, name: 'changed' });

    const ok = await store.closeEditor({ force: true });

    expect(ok).toBe(true);
    expect(store.open).toBe(false);
    expect(useDialogStore().open).toBe(false);
  });

  it('omits isValid/setValid when no validate is configured', () => {
    const blocks = createEditorStore<Model, Model, Payload>({
      empty,
      build: payload => ({ ...empty(), ...(payload ?? {}) }),
      save: model => Promise.resolve(model),
    });
    const store = defineStore('test-editor-no-validate', { state: blocks.state, actions: { ...blocks.actions } })();

    expect('isValid' in store.$state).toBe(false);
    expect((store as unknown as { setValid?: unknown }).setValid).toBeUndefined();
  });
});
