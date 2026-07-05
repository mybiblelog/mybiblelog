// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import AppAchievements from '~/components/popups/AppAchievements.vue';
import { useAchievementsStore } from '~/stores/achievements';

const mountAchievements = () =>
  mount(AppAchievements, { global: { stubs: { teleport: true } } });

beforeEach(() => setActivePinia(createPinia()));

describe('AppAchievements', () => {
  it('renders nothing when no achievement is open', () => {
    const wrapper = mountAchievements();
    expect(wrapper.find('[data-testid="achievements-modal"]').exists()).toBe(false);
  });

  it('shows the book-complete title and message when a book achievement fires', async () => {
    const store = useAchievementsStore();
    const wrapper = mountAchievements();
    store.showBookCompleteAchievement(0);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="achievements-modal"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('achievement.book_complete.title');
    expect(wrapper.text()).toContain('achievement.book_complete.message');
  });

  it('shows the bible-complete title and message when a bible achievement fires', async () => {
    const store = useAchievementsStore();
    const wrapper = mountAchievements();
    store.showBibleCompleteAchievement();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('achievement.bible_complete.title');
    expect(wrapper.text()).toContain('achievement.bible_complete.message');
  });

  it('closes the achievement when the OK button is clicked', async () => {
    const store = useAchievementsStore();
    const wrapper = mountAchievements();
    store.showBibleCompleteAchievement();
    await wrapper.vm.$nextTick();
    await wrapper.get('[data-testid="achievements-ok"]').trigger('click');
    expect(store.open).toBe(false);
  });
});
