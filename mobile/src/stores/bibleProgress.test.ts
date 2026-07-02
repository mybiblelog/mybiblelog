const mockComputeBibleProgress = jest.fn();
jest.mock('@mybiblelog/shared', () => ({
  ...jest.requireActual('@mybiblelog/shared'),
  computeBibleProgress: (...args: unknown[]) => mockComputeBibleProgress(...args),
}));
jest.mock('@/src/storage/dateVerseCountsCache', () => ({
  getCache: jest.fn(async () => null),
  setCache: jest.fn(async () => {}),
}));

import type { BibleProgress } from '@mybiblelog/shared';
import { getCache, setCache } from '@/src/storage/dateVerseCountsCache';
import type { StoredLogEntry } from '@/src/storage/logEntries';
import { useLogEntriesStore } from './logEntries';
import { useUserSettingsStore } from './userSettings';
import { useBibleProgressStore } from './bibleProgress';

const SENTINEL = { overall: { percent: 0.5 }, books: [] } as unknown as BibleProgress;

function setEntries(entries: StoredLogEntry[]) {
  useLogEntriesStore.setState({ state: { status: 'ready', entries, isSyncing: false } });
}
function setLookBack(lookBackDate: string) {
  useUserSettingsStore.setState({
    state: {
      status: 'ready',
      settings: { lookBackDate, dailyVerseCountGoal: 86, preferredBibleVersion: 'ESV', preferredBibleApp: '' },
      isRefreshingFromServer: false,
    },
  });
}

beforeEach(() => {
  mockComputeBibleProgress.mockReset();
  mockComputeBibleProgress.mockReturnValue(SENTINEL);
  (getCache as jest.Mock).mockResolvedValue(null);
  (setCache as jest.Mock).mockClear();
  useBibleProgressStore.setState({ jobs: 0, progress: null });
});

describe('cacheBibleProgress', () => {
  it('filters out entries before the look-back date, then computes and caches', async () => {
    setEntries([
      { clientId: 'old', date: '2019-01-01', startVerseId: 1, endVerseId: 2 },
      { clientId: 'new', date: '2026-06-27', startVerseId: 3, endVerseId: 4 },
    ]);
    setLookBack('2020-01-01');

    await useBibleProgressStore.getState().cacheBibleProgress();

    const ranges = mockComputeBibleProgress.mock.calls[0][0];
    expect(ranges.map((e: StoredLogEntry) => e.clientId)).toEqual(['new']); // "old" excluded
    expect(useBibleProgressStore.getState().progress).toBe(SENTINEL);
    expect(setCache).toHaveBeenCalled();
  });

  it('does not compute when log entries are not ready', async () => {
    useLogEntriesStore.setState({ state: { status: 'loading' } });
    await useBibleProgressStore.getState().cacheBibleProgress();
    expect(mockComputeBibleProgress).not.toHaveBeenCalled();
  });
});
