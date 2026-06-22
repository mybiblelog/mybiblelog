// @vitest-environment happy-dom
//
// Guards the data-loading hooks that Workstream C rewrites (`fetch()` /
// `asyncData` -> `useAsyncData`/`useFetch`) and the `$config` reads that
// Workstream A2 reshapes (`$config.x` -> `$config.public.x`). Each test calls
// the hook directly and asserts the store loader / config value it must keep
// producing, so a regression during those migrations fails here.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

import { useAppInitStore } from '~/stores/app-init';
import { useUserSettingsStore } from '~/stores/user-settings';

import CalendarPage from '@/pages/calendar.vue';
import ProgressPage from '@/pages/progress.vue';
import BooksPage from '@/pages/books/index.vue';
import SettingsPage from '@/pages/settings/index.vue';
import SettingsImportPage from '@/pages/settings/import.vue';
import SettingsExportPage from '@/pages/settings/export.vue';
import StartPage from '@/pages/start.vue';
import RegisterPage from '@/pages/register.vue';

type FetchComponent = { fetch: () => Promise<void> };
type AsyncDataCtx = {
  app?: {
    $http?: { get: (p: string) => Promise<unknown> };
    localePath?: (p: string, locale?: string) => string;
  };
  redirect?: (path: string) => string;
  $config?: Record<string, unknown>;
};
type AsyncDataComponent<T = Record<string, unknown>> = {
  asyncData: (ctx: AsyncDataCtx) => Promise<T> | T;
};

const asFetch = (c: unknown) => c as FetchComponent;
const asAsyncData = <T>(c: unknown) => c as AsyncDataComponent<T>;

beforeEach(() => {
  setActivePinia(createTestingPinia({ stubActions: true, createSpy: vi.fn }));
});

describe('pages with a fetch() hook load user data on entry', () => {
  it.each([
    ['calendar', CalendarPage],
    ['progress', ProgressPage],
    ['books/index', BooksPage],
    ['settings/index', SettingsPage],
    ['settings/import', SettingsImportPage],
    ['settings/export', SettingsExportPage],
  ])('%s fetch() calls appInit.loadUserData', async (_name, page) => {
    await asFetch(page).fetch();
    expect(useAppInitStore().loadUserData).toHaveBeenCalledTimes(1);
  });

  it('start fetch() loads user settings', async () => {
    await asFetch(StartPage).fetch();
    expect(useUserSettingsStore().loadSettings).toHaveBeenCalledTimes(1);
  });
});

describe('start asyncData redirect logic', () => {
  const buildCtx = (settings: { startPage: string; locale?: string }, getImpl?: () => Promise<unknown>) => {
    const redirect = vi.fn((p: string) => p);
    const localePath = vi.fn((p: string) => p);
    const get = vi.fn(getImpl ?? (() => Promise.resolve({ data: settings })));
    return { ctx: { app: { $http: { get }, localePath }, redirect }, redirect, localePath };
  };

  it('redirects to the mapped path when the preferred start page is not "start"', async () => {
    const { ctx, redirect, localePath } = buildCtx({ startPage: 'today', locale: 'en' });
    await asAsyncData(StartPage).asyncData(ctx);
    expect(localePath).toHaveBeenCalledWith('/today', 'en');
    expect(redirect).toHaveBeenCalledWith('/today');
  });

  it('stays on the start page when preferred start page is "start"', async () => {
    const { ctx, redirect } = buildCtx({ startPage: 'start' });
    const result = await asAsyncData(StartPage).asyncData(ctx);
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it('redirects to /login on a 401', async () => {
    const { ctx, redirect } = buildCtx({ startPage: 'today' }, () => Promise.reject(Object.assign(new Error('unauthorized'), { statusCode: 401 })));
    await asAsyncData(StartPage).asyncData(ctx);
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});

describe('register asyncData reads requireEmailVerification from runtime config', () => {
  // Guards the Workstream A2 `$config.x` -> `$config.public.x` reshape.
  it('passes the config flag through', () => {
    const result = asAsyncData<{ requireEmailVerification: boolean }>(RegisterPage).asyncData({
      $config: { requireEmailVerification: false },
    });
    expect(result).toEqual({ requireEmailVerification: false });
  });
});
