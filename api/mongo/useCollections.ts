import { Collection, Db, MongoClient } from 'mongodb';
import { getConfig } from '../config';
import {
  DailyReminderDocument,
  EmailDocument,
  FeedbackDocument,
  LogEntryDocument,
  PassageNoteDocument,
  PassageNoteTagDocument,
  PlanTrackerDocument,
  ReadingPlanDocument,
  UserDocument,
} from './documents';

/**
 * Native MongoDB driver access. The ONLY sanctioned callers are:
 *   1. The repository layer (`api/repositories/*`) — the seam all request-time
 *      and service code uses for data access; the driver stays an
 *      implementation detail behind it (see `repositories/useRepositories.ts`).
 *   2. Operational scripts (`api/scripts/*`) — maintenance tooling that performs
 *      bulk/admin work (cross-collection wipes, backup cursors, raw migrations)
 *      that intentionally bypasses the per-entity repository abstraction.
 *
 * Application code (handlers, services, server bootstrap) must go through
 * `useRepositories()` instead of calling this directly.
 *
 * Collection names match what Mongoose generated for the original models
 * (lowercased + pluralized), so existing databases keep working unchanged.
 */

export interface Collections {
  users: Collection<UserDocument>;
  emails: Collection<EmailDocument>;
  logEntries: Collection<LogEntryDocument>;
  passageNotes: Collection<PassageNoteDocument>;
  passageNoteTags: Collection<PassageNoteTagDocument>;
  readingPlans: Collection<ReadingPlanDocument>;
  planTrackers: Collection<PlanTrackerDocument>;
  dailyReminders: Collection<DailyReminderDocument>;
  feedback: Collection<FeedbackDocument>;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let connecting: Promise<Db> | null = null;

// A single shared connection, established lazily. Mirrors the idempotent
// behavior of the old mongoose.connect() call. The in-flight promise is
// cached so concurrent first callers share one connect instead of each
// constructing a MongoClient (and leaking all but the last).
const connect = async (): Promise<Db> => {
  if (db) {
    return db;
  }
  if (!connecting) {
    connecting = (async () => {
      const newClient = new MongoClient(getConfig().mongo.uri);
      await newClient.connect();
      client = newClient;
      // No explicit name: use the database from the connection string, falling
      // back to `test` exactly as Mongoose did when the URI omitted one.
      db = newClient.db();
      return db;
    })().finally(() => {
      connecting = null;
    });
  }
  return connecting;
};

const useCollections = async (): Promise<Collections> => {
  const database = await connect();
  return {
    users: database.collection<UserDocument>('users'),
    emails: database.collection<EmailDocument>('emails'),
    logEntries: database.collection<LogEntryDocument>('logentries'),
    passageNotes: database.collection<PassageNoteDocument>('passagenotes'),
    passageNoteTags: database.collection<PassageNoteTagDocument>('passagenotetags'),
    readingPlans: database.collection<ReadingPlanDocument>('readingplans'),
    planTrackers: database.collection<PlanTrackerDocument>('plantrackers'),
    dailyReminders: database.collection<DailyReminderDocument>('dailyreminders'),
    feedback: database.collection<FeedbackDocument>('feedbacks'),
  };
};

/**
 * Builds the indexes the application relies on. Uniqueness is enforced
 * primarily by explicit repository checks, but the unique indexes remain an
 * authoritative backstop; the PassageNote `$text` index powers note search.
 */
export const ensureIndexes = async (): Promise<void> => {
  const collections = await useCollections();
  await Promise.all([
    collections.users.createIndex({ email: 1 }, { unique: true }),
    collections.passageNoteTags.createIndex({ owner: 1, label: 1 }, { unique: true }),
    collections.passageNotes.createIndex({ content: 'text' }),
    collections.readingPlans.createIndex({ owner: 1 }),
    collections.planTrackers.createIndex({ owner: 1 }),
    collections.planTrackers.createIndex({ owner: 1, planId: 1 }),
  ]);
};

// Allow the connection to be closed for testing and scripts.
export const closeConnection = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};

// Drops the connected database. Used by the repository test teardown.
export const dropDatabase = async (): Promise<void> => {
  const database = await connect();
  await database.dropDatabase();
};

export default useCollections;
