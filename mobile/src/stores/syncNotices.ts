import { create } from "zustand";

/**
 * Changes the offline queues had to discard, waiting to be told to the user.
 *
 * The log-entry and note queues drop a mutation the server permanently rejects
 * (a 4xx it will never accept), so one bad change can't stall the queue. Without
 * a notice, that entry or note just disappears on the next reload. The queues
 * report here, outside React, and `useSyncDropToasts` turns each report into a
 * toast and consumes it.
 */

type SyncNoticesState = {
  /** Discarded changes not yet shown to the user. */
  droppedCount: number;
};

export const useSyncNoticesStore = create<SyncNoticesState>(() => ({ droppedCount: 0 }));

/** Record `count` changes a queue drain just discarded. */
export function reportDroppedChanges(count: number): void {
  if (count <= 0) return;
  useSyncNoticesStore.setState((s) => ({ droppedCount: s.droppedCount + count }));
}

/** Take the pending count (to show it) and reset it. */
export function consumeDroppedChanges(): number {
  const count = useSyncNoticesStore.getState().droppedCount;
  if (count > 0) useSyncNoticesStore.setState({ droppedCount: 0 });
  return count;
}
