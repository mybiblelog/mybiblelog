// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ActionSheetModal from '~/components/popups/ActionSheetModal.vue';
import { useActionSheetStore } from '~/stores/action-sheet';

const mountSheet = () => mount(ActionSheetModal, { global: { stubs: { teleport: true } } });

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('ActionSheetModal', () => {
  it('renders the title and actions from the store', () => {
    useActionSheetStore().openSheet({
      title: 'Choose an action',
      actions: [{ label: 'First' }, { label: 'Second' }],
    });
    const wrapper = mountSheet();

    expect(wrapper.get('.action-sheet-title').text()).toBe('Choose an action');
    const items = wrapper.findAll('[data-testid="action-sheet-item"]');
    expect(items).toHaveLength(2);
    expect(items[0]?.text()).toBe('First');
    expect(items[1]?.text()).toBe('Second');
  });

  it('clicking an action closes the sheet and invokes its callback', async () => {
    const callback = vi.fn();
    const store = useActionSheetStore();
    store.openSheet({ title: 'Pick one', actions: [{ label: 'Do it', callback }] });
    const wrapper = mountSheet();

    await wrapper.get('[data-testid="action-sheet-item"]').trigger('click');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(store.open).toBe(false);
  });

  it('clicking the overlay closes the sheet without invoking a callback', async () => {
    const callback = vi.fn();
    const store = useActionSheetStore();
    store.openSheet({ title: 'Pick one', actions: [{ label: 'Do it', callback }] });
    const wrapper = mountSheet();

    await wrapper.get('.action-sheet-overlay').trigger('click');

    expect(callback).not.toHaveBeenCalled();
    expect(store.open).toBe(false);
  });

  it('closes on Escape only while open', async () => {
    const store = useActionSheetStore();

    // Not open yet: Escape is a no-op.
    const closedWrapper = mountSheet();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await closedWrapper.vm.$nextTick();
    expect(store.open).toBe(false);

    store.openSheet({ title: 'Pick one', actions: [{ label: 'Do it' }] });
    const openWrapper = mountSheet();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await openWrapper.vm.$nextTick();
    expect(store.open).toBe(false);
  });
});
