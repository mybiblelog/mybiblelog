import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMobileOperatingSystem, isMobileOperatingSystem } from './device';

const WINDOWS_PHONE_UA
  = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; Android; ARM; Touch)';
const ANDROID_UA
  = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36';
const IOS_UA
  = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
const DESKTOP_UA
  = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

describe('device', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getMobileOperatingSystem', () => {
    it('detects Windows Phone even though its UA also contains "Android"', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: WINDOWS_PHONE_UA });
      expect(getMobileOperatingSystem()).toBe('Windows Phone');
    });

    it('detects Android', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: ANDROID_UA });
      expect(getMobileOperatingSystem()).toBe('Android');
    });

    it('detects iOS when window.MSStream is not present', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: IOS_UA });
      expect(getMobileOperatingSystem()).toBe('iOS');
    });

    it('does not report iOS when window.MSStream is present', () => {
      vi.stubGlobal('window', { MSStream: {} });
      vi.stubGlobal('navigator', { userAgent: IOS_UA });
      expect(getMobileOperatingSystem()).toBe('unknown');
    });

    it('falls back to unknown for a desktop user agent', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: DESKTOP_UA });
      expect(getMobileOperatingSystem()).toBe('unknown');
    });

    it('returns unknown when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      expect(getMobileOperatingSystem()).toBe('unknown');
    });
  });

  describe('isMobileOperatingSystem', () => {
    it('returns true for a mobile user agent', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: ANDROID_UA });
      expect(isMobileOperatingSystem()).toBe(true);
    });

    it('returns false for a desktop user agent', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { userAgent: DESKTOP_UA });
      expect(isMobileOperatingSystem()).toBe(false);
    });

    it('returns false when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      expect(isMobileOperatingSystem()).toBe(false);
    });
  });
});
