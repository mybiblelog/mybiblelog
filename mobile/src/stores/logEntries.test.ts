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
import { getIsOnline } from '@/src/stores/connectivity';
import { loadPendingLogEntryMutations } from '@/src/storage/logEntries';
import { useLogEntriesStore } from './logEntries';

const actions = () => useLogEntriesStore.getState();
const entry = { date: '2026-06-27', startVerseId: 43003016, endVerseId: 43003018 };

function setReady(entries: any[] = []) {
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

  it('posts to the API and reloads instead of queueing', async () => {
    (postLogEntry as jest.Mock).mockResolvedValue({ id: 'server-1', ...entry });
    (fetchLogEntries as jest.Mock).mockResolvedValue([{ id: 'server-1', ...entry }]);

    await actions().createEntry(entry);

    expect(postLogEntry).toHaveBeenCalledTimes(1);
    expect(fetchLogEntries).toHaveBeenCalled();
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
