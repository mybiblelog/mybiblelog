import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { drizzle, type SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import { migrate } from 'drizzle-orm/sqlite-proxy/migrator';
import { getConfig } from '../config';

/**
 * SQLite access for the SQLite repository implementation. The database is the
 * built-in `node:sqlite` module, driven through Drizzle's `sqlite-proxy` driver
 * (stable Drizzle has no `node:sqlite` driver yet). Repositories only see the
 * async Drizzle API, so moving to `drizzle-orm/d1` later only touches this file.
 *
 * Only repositories (`repositories/sqlite/*`) and the repository test helpers
 * should use this module; everything else goes through `useRepositories()`.
 */

export type SqliteDb = SqliteRemoteDatabase;

// Compiled output lives in dist/sqlite, which the build copies migrations into.
const MIGRATIONS_FOLDER = path.resolve(__dirname, 'migrations');

type Method = 'run' | 'all' | 'values' | 'get';

let sqlite: DatabaseSync | null = null;
let db: SqliteDb | null = null;
let opening: Promise<SqliteDb> | null = null;
const statements = new Map<string, StatementSync>();

const prepare = (connection: DatabaseSync, sql: string): StatementSync => {
  let statement = statements.get(sql);
  if (!statement) {
    statement = connection.prepare(sql);
    // Drizzle's proxy driver maps rows positionally.
    statement.setReturnArrays(true);
    statements.set(sql, statement);
  }
  return statement;
};

const execute = (connection: DatabaseSync, sql: string, params: unknown[], method: Method): { rows: unknown[] } => {
  const statement = prepare(connection, sql);
  const args = params as (string | number | null)[];
  if (method === 'run') {
    statement.run(...args);
    return { rows: [] };
  }
  if (method === 'get') {
    return { rows: statement.get(...args) as unknown as unknown[] };
  }
  return { rows: statement.all(...args) as unknown[] };
};

/**
 * Runs `fn` inside a write transaction. node:sqlite is synchronous, so nothing
 * else on this connection can interleave with the statements in `fn`.
 */
const inTransaction = <T>(connection: DatabaseSync, fn: () => T): T => {
  connection.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    connection.exec('COMMIT');
    return result;
  }
  catch (error) {
    connection.exec('ROLLBACK');
    throw error;
  }
};

const open = async (): Promise<SqliteDb> => {
  const { sqlitePath } = getConfig().database;
  const inMemory = sqlitePath === ':memory:';
  if (!inMemory) {
    fs.mkdirSync(path.dirname(path.resolve(sqlitePath)), { recursive: true });
  }

  const connection = new DatabaseSync(sqlitePath);
  connection.exec('PRAGMA foreign_keys = ON');
  if (!inMemory) {
    // A file database may be shared with another process (a dev server and
    // the API test runner): WAL lets readers proceed during a write, and the
    // busy timeout makes a writer wait for the other process's lock.
    connection.exec('PRAGMA journal_mode = WAL');
    connection.exec('PRAGMA busy_timeout = 5000');
  }

  const database = drizzle(
    async (sql, params, method) => execute(connection, sql, params, method),
    async (queries) => inTransaction(connection, () =>
      queries.map(({ sql, params, method }) => execute(connection, sql, params, method))),
  );

  await migrate(database, async (migrationQueries) => {
    inTransaction(connection, () => {
      for (const query of migrationQueries) {
        connection.exec(query);
      }
    });
  }, { migrationsFolder: MIGRATIONS_FOLDER });

  sqlite = connection;
  return database;
};

/** Returns the shared database, opening and migrating it on first use. */
export const useDatabase = async (): Promise<SqliteDb> => {
  if (db) {
    return db;
  }
  if (!opening) {
    opening = open().then((database) => {
      db = database;
      return database;
    }).finally(() => {
      opening = null;
    });
  }
  return opening;
};

export const closeDatabase = async (): Promise<void> => {
  statements.clear();
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
};

const DATA_TABLES = [
  'user_platforms',
  'users',
  'log_entries',
  'passage_note_passages',
  'passage_note_tag_links',
  'passage_notes',
  'passage_note_tags',
  'daily_reminders',
  'feedback',
  'emails',
];

/** Deletes every row (the schema is kept). Used by the repository tests. */
export const resetDatabase = async (): Promise<void> => {
  await useDatabase();
  inTransaction(sqlite!, () => {
    for (const table of DATA_TABLES) {
      sqlite!.exec(`DELETE FROM ${table}`);
    }
  });
};

/** Runs a raw query and returns plain-object rows. Used by the repository tests. */
export const queryRows = async (sql: string, ...params: (string | number | null)[]): Promise<Record<string, unknown>[]> => {
  await useDatabase();
  return sqlite!.prepare(sql).all(...params) as Record<string, unknown>[];
};
