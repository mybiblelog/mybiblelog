import * as SecureStore from 'expo-secure-store';
import {
  clearAuthSession,
  loadAuthSession,
  loadLastLoggedInEmail,
  saveAuthSession,
  saveLastLoggedInEmail,
  type AuthSession,
} from './authStorage';

// On native (default Platform.OS in jest-expo is "ios"), these go through the
// mocked expo-secure-store from jest.setup.ts.
const session: AuthSession = { token: 'tok', user: { email: 'a@b.com' } };

beforeEach(async () => {
  await SecureStore.deleteItemAsync('auth.session.v1');
  await SecureStore.deleteItemAsync('auth.lastLoggedInEmail.v1');
});

describe('auth session storage', () => {
  it('returns null when no session is stored', async () => {
    expect(await loadAuthSession()).toBeNull();
  });

  it('round-trips a saved session', async () => {
    await saveAuthSession(session);
    expect(await loadAuthSession()).toEqual(session);
  });

  it('returns null for a structurally invalid stored session', async () => {
    await SecureStore.setItemAsync('auth.session.v1', JSON.stringify({ token: 1 }));
    expect(await loadAuthSession()).toBeNull();
  });

  it('returns null for corrupt JSON', async () => {
    await SecureStore.setItemAsync('auth.session.v1', 'not json');
    expect(await loadAuthSession()).toBeNull();
  });

  it('clears a stored session', async () => {
    await saveAuthSession(session);
    await clearAuthSession();
    expect(await loadAuthSession()).toBeNull();
  });
});

describe('last logged-in email', () => {
  it('round-trips a trimmed email', async () => {
    await saveLastLoggedInEmail('  a@b.com  ');
    expect(await loadLastLoggedInEmail()).toBe('a@b.com');
  });

  it('ignores a blank email', async () => {
    await saveLastLoggedInEmail('   ');
    expect(await loadLastLoggedInEmail()).toBeNull();
  });
});
