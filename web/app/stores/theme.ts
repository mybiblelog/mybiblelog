import { defineStore } from 'pinia';

export const THEME_COOKIE_NAME = 'mbl_theme';
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ThemeMode = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

const VALID_MODES: ThemeMode[] = ['system', 'light', 'dark'];

const parseCookieHeader = (cookieHeader: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) { continue; }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) { continue; }
    const name = trimmed.slice(0, eqIdx).trim();
    const rawValue = trimmed.slice(eqIdx + 1);
    if (!name) { continue; }
    try {
      out[name] = decodeURIComponent(rawValue);
    }
    catch {
      out[name] = rawValue;
    }
  }
  return out;
};

const normalizeThemeMode = (mode: unknown): ThemeMode => {
  if (typeof mode === 'string' && VALID_MODES.includes(mode as ThemeMode)) {
    return mode as ThemeMode;
  }
  return 'system';
};

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'system' as ThemeMode,
    systemTheme: 'light' as ResolvedTheme,
  }),
  getters: {
    resolvedTheme(state): ResolvedTheme {
      return state.mode === 'system' ? state.systemTheme : state.mode;
    },
  },
  actions: {
    initFromCookie(cookieHeader: unknown): void {
      const cookies = parseCookieHeader(String(cookieHeader || ''));
      this.mode = normalizeThemeMode(cookies[THEME_COOKIE_NAME]);
    },

    initClient(): void {
      if (!import.meta.client || typeof window === 'undefined' || !window.matchMedia) {
        this.applyThemeAttrs();
        return;
      }
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemTheme = mediaQuery.matches ? 'dark' : 'light';
      const onColorSchemeChange = (event: MediaQueryListEvent) => {
        this.systemTheme = event.matches ? 'dark' : 'light';
        if (this.mode === 'system') {
          this.applyThemeAttrs();
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', onColorSchemeChange);
      }
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(onColorSchemeChange);
      }
      this.applyThemeAttrs();
    },

    setMode(mode: ThemeMode): void {
      this.mode = normalizeThemeMode(mode);
      this.persistMode();
      this.applyThemeAttrs();
    },

    persistMode(): void {
      if (!import.meta.client || typeof document === 'undefined') { return; }
      const encoded = encodeURIComponent(this.mode);
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${THEME_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    },

    applyThemeAttrs(): void {
      if (!import.meta.client || typeof document === 'undefined') { return; }
      const root = document.documentElement;
      if (this.mode === 'system') {
        root.removeAttribute('data-theme');
      }
      else {
        root.setAttribute('data-theme', this.mode);
      }
      root.style.colorScheme = this.resolvedTheme;
    },
  },
});
