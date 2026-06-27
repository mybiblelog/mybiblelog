export type LogEntry = {
  /**
   * Server-side ID (present for entries loaded from /api/log-entries).
   * Note: the API may return either `id` (via model `toJSON()`) or `_id` (raw mongoose doc).
   */
  id?: string;
  /**
   * Client-side stable ID used for offline-first editing/deleting.
   * Always present for entries persisted on device (generated for legacy entries if missing).
   */
  clientId?: string;
  startVerseId: number;
  endVerseId: number;
  date: string;
};

