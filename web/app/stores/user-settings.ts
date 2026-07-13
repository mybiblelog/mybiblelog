import { defineStore } from 'pinia';
import {
  BibleApps,
  BibleVersions,
  getAppReadingUrl,
  getDefaultBibleApp,
  getDefaultBibleVersion,
} from '@mybiblelog/shared';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';
import { localStore, sessionStore } from '~/helpers/app-storage';

const DEFAULT_BIBLE_APP = getDefaultBibleApp();
const DEFAULT_BIBLE_VERSION = getDefaultBibleVersion();

export type PreferredBibleApp = keyof typeof BibleApps;
export type PreferredBibleVersion = keyof typeof BibleVersions;

export type UserSettings = {
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

// The `/api/settings` payload. Fields are validated at runtime below (the
// server contract isn't guaranteed), so each is narrowed before use.
type ServerSettingsResponse = {
  lookBackDate?: string;
  dailyVerseCountGoal?: number;
  preferredBibleVersion?: string;
  startPage?: string;
  passageNoteTagSortOrder?: string;
  locale?: string;
};

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
      const { $http } = useNuxtApp();
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
        if (preferredBibleApp) {
          localStore.set('preferredBibleApp', preferredBibleApp);
        }

        await $http.patch('/api/settings', {
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
      if (this.isLoaded) { return; }
      await this.loadServerSettings();
    },

    async loadServerSettings(): Promise<void> {
      const { $http } = useNuxtApp();
      const { data } = await $http.get<ServerSettingsResponse>('/api/settings');
      const {
        lookBackDate,
        dailyVerseCountGoal,
        preferredBibleVersion,
        startPage,
        passageNoteTagSortOrder,
        locale,
      } = data || {};

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
    },

    loadClientSettings(): void {
      const preferredBibleApp = localStore.get('preferredBibleApp') ?? (DEFAULT_BIBLE_APP as PreferredBibleApp);
      this.readingTrackerResetDelayed = sessionStore.get('readingTrackerResetDelayed') ?? false;
      this.applySettingsUpdate({ preferredBibleApp });
    },

    dismissReadingTrackerReset(): void {
      this.readingTrackerResetDelayed = true;
      sessionStore.set('readingTrackerResetDelayed', true);
    },
  },
});
