// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import InfoLink from '~/components/ui/InfoLink.vue';

const mountInfoLink = (to: string) =>
  mount(InfoLink, {
    props: { to },
    global: { stubs: { NuxtLink: RouterLinkStub } },
  });

describe('InfoLink', () => {
  it('links to the provided target', () => {
    const wrapper = mountInfoLink('/about/page-features--login');
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/about/page-features--login');
  });

  it('renders the info glyph and an aria-label', () => {
    const wrapper = mountInfoLink('/x');
    expect(wrapper.get('.info-icon').text()).toBe('i');
    // useI18n is stubbed to echo keys.
    expect(wrapper.getComponent(RouterLinkStub).attributes('aria-label')).toBe('aria.more_information');
  });
});
