import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useThemeStore, THEME_COOKIE_NAME } from '~/stores/theme';

beforeEach(() => setActivePinia(createPinia()));

describe('theme store', () => {
  it('defaults to system mode resolving to the system theme', () => {
    const store = useThemeStore();
    expect(store.mode).toBe('system');
    expect(store.resolvedTheme).toBe('light');
  });

  it('resolvedTheme follows the system theme when in system mode', () => {
    const store = useThemeStore();
    store.systemTheme = 'dark';
    expect(store.resolvedTheme).toBe('dark');
  });

  it('resolvedTheme uses the explicit mode when not system', () => {
    const store = useThemeStore();
    store.systemTheme = 'dark';
    store.setMode('light');
    expect(store.mode).toBe('light');
    expect(store.resolvedTheme).toBe('light');
  });

  it('setMode falls back to system for unknown values', () => {
    const store = useThemeStore();
    store.setMode('hologram' as never);
    expect(store.mode).toBe('system');
  });

  describe('initFromCookie', () => {
    it('reads a valid theme from the cookie header', () => {
      const store = useThemeStore();
      store.initFromCookie(`foo=bar; ${THEME_COOKIE_NAME}=dark`);
      expect(store.mode).toBe('dark');
    });

    it('decodes url-encoded values', () => {
      const store = useThemeStore();
      store.initFromCookie(`${THEME_COOKIE_NAME}=${encodeURIComponent('light')}`);
      expect(store.mode).toBe('light');
    });

    it('falls back to system when absent or invalid', () => {
      const store = useThemeStore();
      store.initFromCookie('');
      expect(store.mode).toBe('system');
      store.initFromCookie(`${THEME_COOKIE_NAME}=purple`);
      expect(store.mode).toBe('system');
    });
  });
});
