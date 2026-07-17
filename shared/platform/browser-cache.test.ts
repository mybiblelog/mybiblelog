import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BrowserCache from './browser-cache';

class MemorySessionStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe('BrowserCache', () => {
  let sessionStorageMock: MemorySessionStorage;

  beforeEach(() => {
    sessionStorageMock = new MemorySessionStorage();
    vi.stubGlobal('window', {});
    vi.stubGlobal('sessionStorage', sessionStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns the cached value when not expired', () => {
    BrowserCache.set('key', 'hello', 10);
    expect(BrowserCache.get('key')).toBe('hello');
  });

  it('returns null and clears the entry when the cache has expired', () => {
    BrowserCache.set('key', 'hello', 10);
    vi.useFakeTimers();
    vi.advanceTimersByTime(11 * 60000);
    expect(BrowserCache.get('key')).toBeNull();
    expect(sessionStorageMock.getItem('key')).toBeNull();
  });

  it('returns null when the key is missing', () => {
    expect(BrowserCache.get('missing')).toBeNull();
  });

  it('returns null and clears the entry when the stored value is corrupted JSON', () => {
    sessionStorageMock.setItem('key', 'not json');
    expect(BrowserCache.get('key')).toBeNull();
    expect(sessionStorageMock.getItem('key')).toBeNull();
  });

  it('returns null when window is undefined (SSR)', () => {
    vi.stubGlobal('window', undefined);
    expect(BrowserCache.get('key')).toBeNull();
  });
});
