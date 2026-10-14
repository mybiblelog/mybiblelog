/**
 * Same-origin cross-tab notification for completed email-auth flows.
 *
 * When a magic link is opened in a new tab and completes a flow (verify email,
 * reset password, change email), any other tab sitting on the code-entry modal
 * should react (close and move on). We broadcast a small event over the
 * `BroadcastChannel` API, falling back to a `localStorage` write (whose `storage`
 * event fires in *other* tabs) for browsers without BroadcastChannel.
 *
 * All functions are client-only no-ops on the server.
 */

export type AuthChannelFlow = 'verify-email' | 'reset-password' | 'change-email';

export interface AuthChannelEvent {
  type: 'completed';
  flow: AuthChannelFlow;
  email: string;
}

const CHANNEL_NAME = 'mybiblelog-auth';
const STORAGE_KEY = 'mbl-auth-channel-event';

const supportsBroadcastChannel = (): boolean => typeof BroadcastChannel !== 'undefined';

/**
 * Type guard for a parsed `AuthChannelEvent` payload arriving over either
 * transport (BroadcastChannel message data or a JSON-parsed storage value).
 * Exported so it (and its callers below) can be unit tested directly.
 */
export const isAuthEvent = (value: unknown): value is AuthChannelEvent =>
  Boolean(value) && typeof value === 'object' &&
  (value as AuthChannelEvent).type === 'completed' &&
  typeof (value as AuthChannelEvent).email === 'string';

// Transport logic, split out from the `import.meta.client` guards below so it
// can be unit tested directly: the test runner's server-only esbuild define
// compiles `import.meta.client` to `false`, which would make the guarded
// entry points below permanent no-ops under test (see stores/auth.ts's
// `purgePwaRuntimeCache` for the same pattern).

/** Broadcasts a completed-flow event to other tabs on this origin. Assumes a client context. */
export const postAuthEventImpl = (event: AuthChannelEvent): void => {
  if (supportsBroadcastChannel()) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
    return;
  }

  // Fallback: a value change fires `storage` in other tabs. Include a nonce so
  // repeated identical events still register as a change.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...event, nonce: Date.now() }));
    localStorage.removeItem(STORAGE_KEY);
  }
  catch {
    // Storage may be unavailable (private mode, quota); the modal still works
    // via its own request and window-focus refetch.
  }
};

/** Broadcasts a completed-flow event to other tabs on this origin. */
export const postAuthEvent = (event: AuthChannelEvent): void => {
  if (!import.meta.client) { return; }
  postAuthEventImpl(event);
};

/**
 * Subscribes to completed-flow events from other tabs. Returns an unsubscribe
 * function. Assumes a client context.
 */
export const onAuthEventImpl = (handler: (event: AuthChannelEvent) => void): (() => void) => {
  if (supportsBroadcastChannel()) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const onMessage = (e: MessageEvent) => {
      if (isAuthEvent(e.data)) { handler(e.data); }
    };
    channel.addEventListener('message', onMessage);
    return () => {
      channel.removeEventListener('message', onMessage);
      channel.close();
    };
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) { return; }
    try {
      const parsed = JSON.parse(e.newValue);
      if (isAuthEvent(parsed)) { handler(parsed); }
    }
    catch {
      // ignore malformed payloads
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
};

/**
 * Subscribes to completed-flow events from other tabs. Returns an unsubscribe
 * function; call it in `onUnmounted`.
 */
export const onAuthEvent = (handler: (event: AuthChannelEvent) => void): (() => void) => {
  if (!import.meta.client) { return () => {}; }
  return onAuthEventImpl(handler);
};
