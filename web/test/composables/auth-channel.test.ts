import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isAuthEvent,
  postAuthEventImpl,
  onAuthEventImpl,
  type AuthChannelEvent,
} from '~/composables/auth-channel';

// `postAuthEvent`/`onAuthEvent` themselves live behind `if (import.meta.client)`,
// which the test runner's server-only esbuild define compiles to a permanent
// no-op (see stores/auth.ts's `purgePwaRuntimeCache` for the same limitation).
// Test the extracted `*Impl` functions directly instead, matching that
// suite's convention.

const sampleEvent: AuthChannelEvent = { type: 'completed', flow: 'reset-password', email: 'a@b.com' };

describe('isAuthEvent', () => {
  it('accepts a well-formed completed event', () => {
    expect(isAuthEvent(sampleEvent)).toBe(true);
  });

  it('rejects null/undefined and non-objects', () => {
    expect(isAuthEvent(null)).toBe(false);
    expect(isAuthEvent(undefined)).toBe(false);
    expect(isAuthEvent('completed')).toBe(false);
  });

  it('rejects an object with the wrong type or a non-string email', () => {
    expect(isAuthEvent({ type: 'other', email: 'a@b.com' })).toBe(false);
    expect(isAuthEvent({ type: 'completed', email: 42 })).toBe(false);
  });
});

describe('postAuthEventImpl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses BroadcastChannel when available', () => {
    const postMessage = vi.fn();
    const close = vi.fn();
    const BroadcastChannelMock = vi.fn().mockImplementation(function() { return { postMessage, close }; });
    vi.stubGlobal('BroadcastChannel', BroadcastChannelMock);
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem, removeItem: vi.fn() });

    postAuthEventImpl(sampleEvent);

    expect(BroadcastChannelMock).toHaveBeenCalledWith('mybiblelog-auth');
    expect(postMessage).toHaveBeenCalledWith(sampleEvent);
    expect(close).toHaveBeenCalledTimes(1);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('falls back to localStorage when BroadcastChannel is unavailable', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    const setItem = vi.fn();
    const removeItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem, removeItem });

    postAuthEventImpl(sampleEvent);

    expect(setItem).toHaveBeenCalledTimes(1);
    const [key, value] = setItem.mock.calls[0];
    expect(key).toBe('mbl-auth-channel-event');
    expect(JSON.parse(value)).toMatchObject(sampleEvent);
    expect(removeItem).toHaveBeenCalledWith('mbl-auth-channel-event');
  });

  it('swallows a localStorage write failure (quota/private mode)', () => {
    vi.stubGlobal('BroadcastChannel', undefined);
    vi.stubGlobal('localStorage', {
      setItem: vi.fn().mockImplementation(() => { throw new Error('QuotaExceededError'); }),
      removeItem: vi.fn(),
    });

    expect(() => postAuthEventImpl(sampleEvent)).not.toThrow();
  });
});

describe('onAuthEventImpl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('BroadcastChannel transport', () => {
    let listeners: Record<string, (e: unknown) => void>;
    let close: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      listeners = {};
      close = vi.fn();
      const BroadcastChannelMock = vi.fn().mockImplementation(function() {
        return {
          addEventListener: (type: string, cb: (e: unknown) => void) => { listeners[type] = cb; },
          removeEventListener: vi.fn(),
          close,
        };
      });
      vi.stubGlobal('BroadcastChannel', BroadcastChannelMock);
    });

    it('invokes the handler for a valid message', () => {
      const handler = vi.fn();
      onAuthEventImpl(handler);
      listeners.message({ data: sampleEvent });
      expect(handler).toHaveBeenCalledWith(sampleEvent);
    });

    it('ignores a malformed message', () => {
      const handler = vi.fn();
      onAuthEventImpl(handler);
      listeners.message({ data: { foo: 'bar' } });
      expect(handler).not.toHaveBeenCalled();
    });

    it('unsubscribe closes the channel', () => {
      const unsubscribe = onAuthEventImpl(vi.fn());
      unsubscribe();
      expect(close).toHaveBeenCalledTimes(1);
    });
  });

  describe('storage fallback transport', () => {
    let listeners: Record<string, (e: StorageEvent) => void>;

    beforeEach(() => {
      vi.stubGlobal('BroadcastChannel', undefined);
      listeners = {};
      vi.stubGlobal('window', {
        addEventListener: (type: string, cb: (e: StorageEvent) => void) => { listeners[type] = cb; },
        removeEventListener: vi.fn(),
      });
    });

    it('invokes the handler for a matching key with a valid payload', () => {
      const handler = vi.fn();
      onAuthEventImpl(handler);
      listeners.storage({
        key: 'mbl-auth-channel-event',
        newValue: JSON.stringify(sampleEvent),
      } as StorageEvent);
      expect(handler).toHaveBeenCalledWith(sampleEvent);
    });

    it('ignores events for an unrelated storage key', () => {
      const handler = vi.fn();
      onAuthEventImpl(handler);
      listeners.storage({
        key: 'some-other-key',
        newValue: JSON.stringify(sampleEvent),
      } as StorageEvent);
      expect(handler).not.toHaveBeenCalled();
    });

    it('does not throw or invoke the handler on malformed JSON', () => {
      const handler = vi.fn();
      onAuthEventImpl(handler);
      expect(() => listeners.storage({
        key: 'mbl-auth-channel-event',
        newValue: '{not valid json',
      } as StorageEvent)).not.toThrow();
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
