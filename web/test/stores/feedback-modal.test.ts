import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFeedbackModalStore } from '~/stores/feedback-modal';

beforeEach(() => setActivePinia(createPinia()));

describe('feedback-modal store', () => {
  it('starts closed', () => {
    expect(useFeedbackModalStore().open).toBe(false);
  });

  it('opens and closes', () => {
    const store = useFeedbackModalStore();
    store.openModal();
    expect(store.open).toBe(true);
    store.closeModal();
    expect(store.open).toBe(false);
  });
});
