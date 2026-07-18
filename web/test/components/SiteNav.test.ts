// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import SiteNav from '~/components/layout/SiteNav.vue';
import { useAuthStore } from '~/stores/auth';

const flushOutsideClickAttach = async () => {
  await nextTick();
  // useClickOutside defers attaching its document listener by a tick.
  await new Promise(resolve => setTimeout(resolve, 0));
};

const clickOutside = async () => {
  document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await nextTick();
};

const pressEscape = async () => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  await nextTick();
};

const mountNav = () =>
  mount(SiteNav, {
    global: {
      stubs: {
        NuxtLink: true,
        LayoutThemeSwitcher: true,
        LayoutLanguageSwitcher: true,
      },
    },
  });

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('SiteNav', () => {
  it('shows sign up/sign in links when logged out', () => {
    const wrapper = mountNav();
    expect(wrapper.find('.site-nav__admin').exists()).toBe(false);
    expect(wrapper.find('.site-nav__account').exists()).toBe(false);
  });

  it('shows the admin dropdown trigger only for admin users', () => {
    const authStore = useAuthStore();
    authStore.setUser({ email: 'admin@example.com', isAdmin: true });
    const wrapper = mountNav();
    expect(wrapper.find('.site-nav__admin-trigger').exists()).toBe(true);
  });

  it('toggles the admin dropdown open and closed on trigger clicks', async () => {
    const authStore = useAuthStore();
    authStore.setUser({ email: 'admin@example.com', isAdmin: true });
    const wrapper = mountNav();

    expect(wrapper.find('.site-nav__admin-panel').exists()).toBe(false);
    await wrapper.get('.site-nav__admin-trigger').trigger('click');
    expect(wrapper.find('.site-nav__admin-panel').exists()).toBe(true);
    await wrapper.get('.site-nav__admin-trigger').trigger('click');
    expect(wrapper.find('.site-nav__admin-panel').exists()).toBe(false);
  });

  it('closes the admin dropdown on an outside click', async () => {
    const authStore = useAuthStore();
    authStore.setUser({ email: 'admin@example.com', isAdmin: true });
    const wrapper = mountNav();

    await wrapper.get('.site-nav__admin-trigger').trigger('click');
    expect(wrapper.find('.site-nav__admin-panel').exists()).toBe(true);

    await flushOutsideClickAttach();
    await clickOutside();

    expect(wrapper.find('.site-nav__admin-panel').exists()).toBe(false);
  });

  it('closes the admin dropdown on Escape', async () => {
    const authStore = useAuthStore();
    authStore.setUser({ email: 'admin@example.com', isAdmin: true });
    const wrapper = mountNav();

    await wrapper.get('.site-nav__admin-trigger').trigger('click');
    expect(wrapper.find('.site-nav__admin-panel').exists()).toBe(true);

    await pressEscape();

    expect(wrapper.find('.site-nav__admin-panel').exists()).toBe(false);
  });

  it('opening the admin dropdown closes an open account dropdown, and vice versa', async () => {
    const authStore = useAuthStore();
    authStore.setUser({ email: 'admin@example.com', isAdmin: true });
    const wrapper = mountNav();

    await wrapper.get('.site-nav__account-trigger').trigger('click');
    expect(wrapper.find('.site-nav__account-panel').exists()).toBe(true);

    await wrapper.get('.site-nav__admin-trigger').trigger('click');
    expect(wrapper.find('.site-nav__admin-panel').exists()).toBe(true);
    expect(wrapper.find('.site-nav__account-panel').exists()).toBe(false);
  });

  it('opens the mobile drawer and marks the body while it is open', async () => {
    const wrapper = mountNav();
    expect(document.body.classList.contains('site-nav-drawer-open')).toBe(false);

    await wrapper.get('.site-nav__menu-btn').trigger('click');
    expect(document.body.classList.contains('site-nav-drawer-open')).toBe(true);
    expect(wrapper.find('#site-nav-drawer').exists()).toBe(true);
  });

  it('closes the mobile drawer on Escape', async () => {
    const wrapper = mountNav();
    await wrapper.get('.site-nav__menu-btn').trigger('click');
    expect(document.body.classList.contains('site-nav-drawer-open')).toBe(true);

    await pressEscape();

    expect(document.body.classList.contains('site-nav-drawer-open')).toBe(false);
  });
});
