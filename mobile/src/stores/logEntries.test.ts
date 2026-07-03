import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@mybiblelog/shared', () => ({
  ...jest.requireActual('@mybiblelog/shared'),
  fetchLogEntries: jest.fn(),
  postLogEntry: jest.fn(),
  putLogEntry: jest.fn(),
  deleteLogEntryRequest: jest.fn(),
}));
jest.mock('@/src/api/httpClient', () => ({ httpClient: {} }));
jest.mock('@/src/stores/auth', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ state: { status: 'authenticated' } })),
    subscribe: jest.fn(),
  },
}));
jest.mock('@/src/stores/connectivity', () => ({
  getIsOnline: jest.fn(),
  useConnectivityStore: { subscribe: jest.fn() },
}));

import {
  deleteLogEntryRequest,
  fetchLogEntries,
  postLogEntry,
} from '@mybiblelog/shared';
import { ApiError } from '@/src/api/apiError';
import { getIsOnline } from '@/src/stores/connectivity';
import { loadPendingLogEntryMutations, type StoredLogEntry } from '@/src/storage/logEntries';
import { useLogEntriesStore } from './logEntries';

const actions = () => useLogEntriesStore.getState();
const entry = { date: '2026-06-27', startVerseId: 43003016, endVerseId: 43003018 };

function setReady(entries: StoredLogEntry[] = []) {
  useLogEntriesStore.setState({ state: { status: 'ready', entries, isSyncing: false } });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  setReady();
});

describe('createEntry (offline)', () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(false));

  it('adds the entry to the front of the list', async () => {
    await actions().createEntry(entry);
    const state = useLogEntriesStore.getState().state;
    expect(state.status === 'ready' && state.entries[0]).toMatchObject(entry);
    expect(postLogEntry).not.toHaveBeenCalled();
  });

  it('enqueues a create mutation', async () => {
    await actions().createEntry(entry);
    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: 'create', entry });
  });
});

describe('deleteEntry (offline)', () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(false));

  it('removes a synced entry locally and enqueues a delete', async () => {
    setReady([{ ...entry, clientId: 'c1', id: 'server-1' }]);
    await actions().deleteEntry('c1');
    const state = useLogEntriesStore.getState().state;
    expect(state.status === 'ready' && state.entries).toHaveLength(0);
    const queue = await loadPendingLogEntryMutations();
    expect(queue).toEqual([
      expect.objectContaining({ type: 'delete', clientId: 'c1', id: 'server-1' }),
    ]);
  });

  it('coalesces an offline create-then-delete away to an empty queue', async () => {
    await actions().createEntry(entry);
    const created = useLogEntriesStore.getState().state;
    const clientId = created.status === 'ready' ? created.entries[0].clientId : '';
    await actions().deleteEntry(clientId);

    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(0);
    const state = useLogEntriesStore.getState().state;
    expect(state.status === 'ready' && state.entries).toHaveLength(0);
  });
});

describe('createEntry (online)', () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(true));

  it('posts to the API and applies the response locally without a full reload', async () => {
    (postLogEntry as jest.Mock).mockResolvedValue({ id: 'server-1', ...entry });

    await actions().createEntry(entry);

    expect(postLogEntry).toHaveBeenCalledTimes(1);
    expect(fetchLogEntries).not.toHaveBeenCalled();
    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(0);
    const state = useLogEntriesStore.getState().state;
    expect(state.status === 'ready' && state.entries[0]).toMatchObject({ id: 'server-1' });
  });

  it('falls back to the offline queue when the API call fails', async () => {
    (postLogEntry as jest.Mock).mockRejectedValue(new Error('500'));
    await actions().createEntry(entry);
    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ type: 'create' });
    expect(deleteLogEntryRequest).not.toHaveBeenCalled();
  });
});

describe('entry ordering', () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(false));

  it('keeps the list sorted newest-first after local creates', async () => {
    await actions().createEntry({ ...entry, date: '2026-06-01' });
    await actions().createEntry({ ...entry, date: '2026-06-15' });
    await actions().createEntry({ ...entry, date: '2026-06-10' });
    const state = useLogEntriesStore.getState().state;
    const dates = state.status === 'ready' ? state.entries.map((e) => e.date) : [];
    expect(dates).toEqual(['2026-06-15', '2026-06-10', '2026-06-01']);
  });
});

describe('syncNow poison-pill handling', () => {
  beforeEach(() => (getIsOnline as jest.Mock).mockReturnValue(true));

  it('drops a mutation the server permanently rejects (4xx) and drains the queue', async () => {
    await AsyncStorage.setItem(
      'logEntries.mutations.v1',
      JSON.stringify([{ type: 'create', clientId: 'bad', entry, ts: 1 }]),
    );
    (postLogEntry as jest.Mock).mockRejectedValue(
      new ApiError({ code: 'validation_error', errors: [] }, 400),
    );
    (fetchLogEntries as jest.Mock).mockResolvedValue([]);

    await actions().syncNow();

    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(0);
    // Queue drained, so the store reconciled with the server.
    expect(fetchLogEntries).toHaveBeenCalled();
  });

  it('keeps a mutation queued after a transient (network/5xx) failure', async () => {
    await AsyncStorage.setItem(
      'logEntries.mutations.v1',
      JSON.stringify([{ type: 'create', clientId: 'c-retry', entry, ts: 1 }]),
    );
    (postLogEntry as jest.Mock).mockRejectedValue(new Error('network down'));

    await actions().syncNow();

    const queue = await loadPendingLogEntryMutations();
    expect(queue).toHaveLength(1);
    expect(fetchLogEntries).not.toHaveBeenCalled();
  });
});
