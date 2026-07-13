/**
 * The single registry of every Web Storage key the app uses, with its value
 * type. Add or change a persisted key here and nowhere else.
 *
 * Key strings match what is already on users' devices — do not rename them
 * without a migration story.
 */
import { BibleApps } from '@mybiblelog/shared';
import type { LocaleCode } from '@mybiblelog/shared';
import type { PreferredBibleApp } from '~/stores/user-settings';
import { boolFlagCodec, createWebStorage, defineKey, enumCodec, stringCodec } from './typed-storage';

export const localStore = createWebStorage(() => (import.meta.client ? localStorage : null), {
  preferredBibleApp: defineKey<PreferredBibleApp>('store:user-settings:preferredBibleApp', enumCodec(BibleApps)),
  loginLanguage: defineKey<LocaleCode>('login_language', stringCodec<LocaleCode>()),
});

export const sessionStore = createWebStorage(() => (import.meta.client ? sessionStorage : null), {
  readingTrackerResetDelayed: defineKey('readingTrackerResetDelayed', boolFlagCodec),
});
