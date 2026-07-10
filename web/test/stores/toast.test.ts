import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useToastStore } from '~/stores/toast';

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('toast store', () => {
  it('adds a message with the given type and text', () => {
    const store = useToastStore();
    store.add({ type: 'success', text: 'Saved' });
    expect(store.messages).toHaveLength(1);
    expect(store.messages[0]).toMatchObject({ type: 'success', text: 'Saved' });
    expect(typeof store.messages[0].id).toBe('number');
  });

  it('uses a provided id and coerces text to a string', () => {
    const store = useToastStore();
    store.add({ id: 42, text: undefined as unknown as string });
    expect(store.messages[0].id).toBe(42);
    expect(store.messages[0].text).toBe('');
  });

  it('auto-closes a message after the timeout', () => {
    const store = useToastStore();
    store.add({ id: 1, text: 'temp' });
    expect(store.messages).toHaveLength(1);
    vi.advanceTimersByTime(5000);
    expect(store.messages).toHaveLength(0);
  });

  it('close removes only the matching message', () => {
    const store = useToastStore();
    store.add({ id: 1, text: 'a' });
    store.add({ id: 2, text: 'b' });
    store.close(1);
    expect(store.messages.map(m => m.id)).toEqual([2]);
  });
});
