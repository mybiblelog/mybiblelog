// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppModal from '~/components/popups/AppModal.vue';

// Render teleported content inline so it can be queried from the wrapper.
const mountModal = (props: Record<string, unknown>, slots: Record<string, string> = {}) =>
  mount(AppModal, { props, slots, global: { stubs: { teleport: true } } });

describe('AppModal', () => {
  it('renders nothing when closed', () => {
    const wrapper = mountModal({ open: false });
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false);
  });

  it('renders the title and content slot when open', () => {
    const wrapper = mountModal(
      { open: true, title: 'My Title' },
      { content: '<p class="body">hello</p>' },
    );
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true);
    expect(wrapper.get('.mbl-modal__title').text()).toBe('My Title');
    expect(wrapper.get('.body').text()).toBe('hello');
  });

  it('emits close when the backdrop is clicked', async () => {
    const wrapper = mountModal({ open: true });
    await wrapper.get('.mbl-modal__backdrop').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountModal({ open: true });
    await wrapper.get('[data-testid="modal-close"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close when Escape is pressed while open', async () => {
    const wrapper = mountModal({ open: true });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('does not emit close on Escape while closed', async () => {
    const wrapper = mountModal({ open: false });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('renders the footer slot only when provided', () => {
    const withoutFooter = mountModal({ open: true });
    expect(withoutFooter.find('.mbl-modal__foot').exists()).toBe(false);

    const withFooter = mountModal({ open: true }, { footer: '<button>OK</button>' });
    expect(withFooter.find('.mbl-modal__foot').exists()).toBe(true);
  });
});
