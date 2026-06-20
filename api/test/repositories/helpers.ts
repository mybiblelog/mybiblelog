import crypto from 'node:crypto';
import { Types } from 'mongoose';
import { expect } from 'vitest';
import useRepositories from '../../repositories/useRepositories';
import useMongooseModels from '../../mongoose/useMongooseModels';
import type { UserRecord } from '../../repositories/helpers/types';

/**
 * Shared fixtures and utilities for the repository test suite. Everything here
 * talks to the real (dedicated) test database configured in `setup.ts`.
 */

export const getRepos = () => useRepositories();
export const getModels = () => useMongooseModels();

/** A unique, lowercase email so the unique index never collides across tests. */
export const uniqueEmail = (): string =>
  `repo_test_${crypto.randomBytes(8).toString('hex')}@example.com`;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ensures Mongoose has built every collection's indexes (unique constraints,
 * the PassageNote `$text` index, etc.). Mongoose builds indexes lazily, so
 * tests that depend on them call this first.
 */
export const ensureIndexes = async (): Promise<void> => {
  const models = await getModels();
  await Promise.all(Object.values(models).map((model) => model.init()));
};

/** Empties every collection (indexes are preserved). Used between tests. */
export const clearCollections = async (): Promise<void> => {
  const models = await getModels();
  await Promise.all(Object.values(models).map((model) => model.deleteMany({})));
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

/** Asserts a value is a stringified Mongoose/Mongo ObjectId. */
export const expectObjectId = (id: unknown): void => {
  expect(typeof id).toBe('string');
  expect(id as string).toMatch(OBJECT_ID_PATTERN);
  // Round-trips back to an ObjectId whose string form is unchanged.
  expect(new Types.ObjectId(id as string).toString()).toBe(id);
};
