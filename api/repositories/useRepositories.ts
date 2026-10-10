import { getConfig } from '../config';
import useCollections, { closeConnection as closeMongoConnection, ensureIndexes } from '../mongo/useCollections';
import { createDailyReminderRepository } from './daily-reminder.repository';
import { createEmailRepository } from './email.repository';
import { createFeedbackRepository } from './feedback.repository';
import { createLogEntryRepository } from './log-entry.repository';
import { createPassageNoteRepository } from './passage-note.repository';
import { createPassageNoteTagRepository } from './passage-note-tag.repository';
import { createUserRepository } from './user.repository';
import { createSqliteDailyReminderRepository } from './sqlite/daily-reminder.repository';
import { createSqliteEmailRepository } from './sqlite/email.repository';
import { createSqliteFeedbackRepository } from './sqlite/feedback.repository';
import { createSqliteLogEntryRepository } from './sqlite/log-entry.repository';
import { createSqlitePassageNoteRepository } from './sqlite/passage-note.repository';
import { createSqlitePassageNoteTagRepository } from './sqlite/passage-note-tag.repository';
import { createSqliteUserRepository } from './sqlite/user.repository';

const useMongoRepositories = async () => {
  const collections = await useCollections();
  return {
    users: createUserRepository(collections),
    logEntries: createLogEntryRepository(collections),
    passageNotes: createPassageNoteRepository(collections),
    passageNoteTags: createPassageNoteTagRepository(collections),
    dailyReminders: createDailyReminderRepository(collections),
    feedback: createFeedbackRepository(collections),
    emails: createEmailRepository(collections),
  };
};

export type Repositories = Awaited<ReturnType<typeof useMongoRepositories>>;

// Loaded lazily so Mongo deployments never load `node:sqlite` (which still
// prints an experimental-feature warning when imported).
const loadSqlite = () => import('../sqlite/database');

const useSqliteRepositories = async (): Promise<Repositories> => {
  const db = await (await loadSqlite()).useDatabase();
  return {
    users: createSqliteUserRepository(db),
    logEntries: createSqliteLogEntryRepository(db),
    passageNotes: createSqlitePassageNoteRepository(db),
    passageNoteTags: createSqlitePassageNoteTagRepository(db),
    dailyReminders: createSqliteDailyReminderRepository(db),
    feedback: createSqliteFeedbackRepository(db),
    emails: createSqliteEmailRepository(db),
  };
};

/**
 * Async factory returning the repository layer. This is the only seam route
 * handlers should use for data access; the database (MongoDB or SQLite, per
 * `DATABASE_DRIVER`) stays an implementation detail behind it. The underlying
 * connect is idempotent.
 */
const useRepositories = async (): Promise<Repositories> => {
  return getConfig().database.driver === 'sqlite'
    ? useSqliteRepositories()
    : useMongoRepositories();
};

/**
 * Connects to the configured database and prepares it (Mongo indexes, or
 * SQLite migrations, which run on connect).
 */
export const initDatabase = async (): Promise<void> => {
  if (getConfig().database.driver === 'sqlite') {
    await (await loadSqlite()).useDatabase();
    return;
  }
  await ensureIndexes();
};

/** Closes the configured database connection (shutdown, tests, scripts). */
export const closeDatabase = async (): Promise<void> => {
  if (getConfig().database.driver === 'sqlite') {
    await (await loadSqlite()).closeDatabase();
    return;
  }
  await closeMongoConnection();
};

export default useRepositories;
