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

const supportsBroadcastChannel = (): boolean =>
  import.meta.client && typeof BroadcastChannel !== 'undefined';

/** Broadcasts a completed-flow event to other tabs on this origin. */
export const postAuthEvent = (event: AuthChannelEvent): void => {
  if (!import.meta.client) { return; }

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

/**
 * Subscribes to completed-flow events from other tabs. Returns an unsubscribe
 * function; call it in `onUnmounted`.
 */
export const onAuthEvent = (handler: (event: AuthChannelEvent) => void): (() => void) => {
  if (!import.meta.client) { return () => {}; }

  const isAuthEvent = (value: unknown): value is AuthChannelEvent =>
    Boolean(value) && typeof value === 'object' &&
    (value as AuthChannelEvent).type === 'completed' &&
    typeof (value as AuthChannelEvent).email === 'string';

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
