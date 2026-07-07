import { defineStore, getActivePinia } from 'pinia';
import {
  BibleApps,
  BibleVersions,
  getAppReadingUrl,
  getDefaultBibleApp,
  getDefaultBibleVersion,
} from '@mybiblelog/shared';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';

const LocalStorageKeys = {
  PREFERRED_BIBLE_APP: 'store:user-settings:preferredBibleApp',
} as const;

const DEFAULT_BIBLE_APP = getDefaultBibleApp();
const DEFAULT_BIBLE_VERSION = getDefaultBibleVersion();

export type PreferredBibleApp = keyof typeof BibleApps;
export type PreferredBibleVersion = keyof typeof BibleVersions;

export type UserSettings = {
  // NOTE: Known as "Tracker Start Date" in the frontend UI; field needs to be renamed in DB/API.
  lookBackDate: string;
  dailyVerseCountGoal: number;
  preferredBibleApp: PreferredBibleApp;
  preferredBibleVersion: PreferredBibleVersion;
  startPage: string;
  passageNoteTagSortOrder: string;
  locale: string;
};

export type UserSettingsUpdate = Partial<Pick<UserSettings,
  | 'lookBackDate'
  | 'dailyVerseCountGoal'
  | 'preferredBibleApp'
  | 'preferredBibleVersion'
  | 'startPage'
  | 'passageNoteTagSortOrder'
  | 'locale'
>>;

const defaultSettings: UserSettings = {
  lookBackDate: '',
  dailyVerseCountGoal: 0,
  preferredBibleApp: DEFAULT_BIBLE_APP as PreferredBibleApp,
  preferredBibleVersion: DEFAULT_BIBLE_VERSION as PreferredBibleVersion,
  startPage: 'start',
  passageNoteTagSortOrder: 'label:ascending',
  locale: 'en',
};

export const useUserSettingsStore = defineStore('user-settings', {
  state: () => ({
    settings: { ...defaultSettings } as UserSettings,
    // Frontend-only: tracks whether the user dismissed the ReadingTrackerResetCard for this session.
    readingTrackerResetDelayed: false as boolean,
    isLoaded: false,
  }),
  getters: {
    getReadingUrl: state => (bookIndex: number, chapterIndex: number): string => {
      const app = state.settings.preferredBibleApp;
      const version = state.settings.preferredBibleVersion;
      return getAppReadingUrl(app, version, bookIndex, chapterIndex);
    },
  },
  actions: {
    applySettingsUpdate(update: UserSettingsUpdate): void {
      const {
        lookBackDate,
        dailyVerseCountGoal,
        preferredBibleApp,
        preferredBibleVersion,
        startPage,
        passageNoteTagSortOrder,
        locale,
      } = update;

      if (lookBackDate) {
        this.settings.lookBackDate = lookBackDate;

        // If the tracker start date changed, recalculate cached date verse counts.
        useDateVerseCountsStore().cacheDateVerseCounts();
      }
      if (dailyVerseCountGoal) {
        this.settings.dailyVerseCountGoal = dailyVerseCountGoal;
      }
      if (preferredBibleApp) {
        this.settings.preferredBibleApp = preferredBibleApp;
      }
      if (preferredBibleVersion) {
        this.settings.preferredBibleVersion = preferredBibleVersion;
      }
      if (startPage) {
        this.settings.startPage = startPage;
      }
      if (passageNoteTagSortOrder) {
        this.settings.passageNoteTagSortOrder = passageNoteTagSortOrder;
      }
      if (locale) {
        this.settings.locale = locale;
      }
    },

    async updateSettings(update: UserSettingsUpdate): Promise<boolean> {
      const {
        lookBackDate,
        dailyVerseCountGoal,
        preferredBibleApp,
        preferredBibleVersion,
        startPage,
        passageNoteTagSortOrder,
        locale,
      } = update;

      try {
        // Update local storage only if there was a change so we don't erase user settings.
        // The API call below also ignores any values that weren't provided.
        if (preferredBibleApp && process.client) {
          localStorage.setItem(LocalStorageKeys.PREFERRED_BIBLE_APP, preferredBibleApp);
        }

        await this.$http.patch('/api/settings', {
          settings: {
            lookBackDate,
            dailyVerseCountGoal,
            preferredBibleVersion,
            startPage,
            passageNoteTagSortOrder,
            locale,
          },
        });

        this.applySettingsUpdate({
          lookBackDate,
          dailyVerseCountGoal,
          preferredBibleApp,
          preferredBibleVersion,
          startPage,
          passageNoteTagSortOrder,
          locale,
        });

        return true;
      }
      catch {
        return false;
      }
    },

    async loadSettings(): Promise<void> {
      this.loadClientSettings();
      await this.loadServerSettings();
    },

    async loadServerSettings(): Promise<void> {
      // Snapshot the active pinia before any `await`: on the server it is a
      // module-level global, so a concurrent request can replace it mid-action
      // and a late bare `useXStore()` would resolve another request's store.
      const pinia = getActivePinia();

      const { data } = await this.$http.get<Record<string, unknown>>('/api/settings');
      const {
        lookBackDate,
        dailyVerseCountGoal,
        preferredBibleVersion,
        startPage,
        passageNoteTagSortOrder,
        locale,
      } = (data || {}) as Record<string, unknown>;

      this.applySettingsUpdate({
        lookBackDate: typeof lookBackDate === 'string' ? lookBackDate : undefined,
        dailyVerseCountGoal: typeof dailyVerseCountGoal === 'number' ? dailyVerseCountGoal : undefined,
        preferredBibleVersion: (
          typeof preferredBibleVersion === 'string' &&
          (BibleVersions as Record<string, unknown>)[preferredBibleVersion]
        )
          ? preferredBibleVersion as PreferredBibleVersion
          : undefined,
        startPage: typeof startPage === 'string' ? startPage : undefined,
        passageNoteTagSortOrder: typeof passageNoteTagSortOrder === 'string' ? passageNoteTagSortOrder : undefined,
        locale: typeof locale === 'string' ? locale : undefined,
      });

      this.isLoaded = true;

      if (typeof passageNoteTagSortOrder === 'string' && passageNoteTagSortOrder) {
        // Avoid a static import here (passage-note-tags store reads user-settings store).
        const { usePassageNoteTagsStore } = await import('~/stores/passage-note-tags');
        await usePassageNoteTagsStore(pinia).setPassageNoteTagSortOrder({ sortOrder: passageNoteTagSortOrder, persist: false });
      }
    },

    loadClientSettings(): void {
      let preferredBibleApp: PreferredBibleApp = DEFAULT_BIBLE_APP as PreferredBibleApp;
      if (process.client) {
        const localStorageSetting = localStorage.getItem(LocalStorageKeys.PREFERRED_BIBLE_APP);
        if (localStorageSetting && (BibleApps as Record<string, unknown>)[localStorageSetting]) {
          preferredBibleApp = localStorageSetting as PreferredBibleApp;
        }
        this.readingTrackerResetDelayed = sessionStorage.getItem('readingTrackerResetDelayed') === 'true';
      }
      this.applySettingsUpdate({ preferredBibleApp });
    },

    dismissReadingTrackerReset(): void {
      this.readingTrackerResetDelayed = true;
      if (process.client) {
        sessionStorage.setItem('readingTrackerResetDelayed', 'true');
      }
    },
  },
});
