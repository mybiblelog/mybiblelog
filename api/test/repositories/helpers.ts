import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { expect } from 'vitest';
import useRepositories, { initDatabase } from '../../repositories/useRepositories';
import useCollections from '../../mongo/useCollections';
import { queryRows, resetDatabase } from '../../sqlite/database';
import type { UserRecord } from '../../repositories/helpers/types';

/**
 * Shared fixtures and utilities for the repository test suite. Everything here
 * talks to the real (dedicated) test database configured in `setup.ts`, on
 * whichever backend DATABASE_DRIVER selects.
 */

const useSqlite = (): boolean => process.env.DATABASE_DRIVER === 'sqlite';

export const getRepos = () => useRepositories();

/** A unique, lowercase email so the unique index never collides across tests. */
export const uniqueEmail = (): string =>
  `repo_test_${crypto.randomBytes(8).toString('hex')}@example.com`;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ensures the application indexes exist (unique constraints, the PassageNote
 * text index, etc.). Tests that depend on them call this first.
 */
export const ensureIndexes = async (): Promise<void> => {
  await initDatabase();
};

/** Empties every collection/table (indexes are preserved). Used between tests. */
export const clearCollections = async (): Promise<void> => {
  if (useSqlite()) {
    await resetDatabase();
    return;
  }
  const collections = await useCollections();
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};

/*
 * Probes of the stored data, beneath the repository API. Tests use these to
 * assert on what was persisted (e.g. that a password is stored hashed) without
 * depending on a particular backend.
 */

/** Number of stored daily reminders. */
export const countStoredDailyReminders = async (): Promise<number> => {
  if (useSqlite()) {
    const [row] = await queryRows('SELECT count(*) AS n FROM daily_reminders');
    return Number(row!.n);
  }
  const { dailyReminders } = await useCollections();
  return dailyReminders.countDocuments({});
};

/** The stored timestamps of a daily reminder (records don't expose them). */
export const getStoredDailyReminderTimestamps = async (id: string): Promise<{ createdAt: unknown; updatedAt: unknown } | null> => {
  if (useSqlite()) {
    const [row] = await queryRows('SELECT created_at, updated_at FROM daily_reminders WHERE id = ?', id);
    return row ? { createdAt: new Date(Number(row.created_at)), updatedAt: new Date(Number(row.updated_at)) } : null;
  }
  const { dailyReminders } = await useCollections();
  const doc = await dailyReminders.findOne({ _id: new ObjectId(id) });
  return doc && { createdAt: doc.createdAt, updatedAt: doc.updatedAt };
};

/** The stored password (hash) of a user, which records never expose. */
export const getStoredPasswordHash = async (userId: string): Promise<string | null | undefined> => {
  if (useSqlite()) {
    const [row] = await queryRows('SELECT password FROM users WHERE id = ?', userId);
    return row?.password as string | null | undefined;
  }
  const { users } = await useCollections();
  const doc = await users.findOne({ _id: new ObjectId(userId) });
  return doc?.password;
};

/** Creates a throwaway verified user and returns the full record (use `.id` as an owner). */
export const makeOwner = async (overrides: { email?: string } = {}): Promise<UserRecord> => {
  const { users } = await getRepos();
  return users.create({
    email: overrides.email ?? uniqueEmail(),
    password: 'password123',
    locale: 'en',
    emailVerificationCode: '', // mark verified
  });
};

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/;

/** Asserts a value is a stringified Mongo ObjectId. */
export const expectObjectId = (id: unknown): void => {
  expect(typeof id).toBe('string');
  expect(id as string).toMatch(OBJECT_ID_PATTERN);
  // Round-trips back to an ObjectId whose string form is unchanged.
  expect(new ObjectId(id as string).toString()).toBe(id);
};
