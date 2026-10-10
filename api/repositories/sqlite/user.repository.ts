import { and, asc, count, desc, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm';
import type { SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core';
import type { SqliteDb } from '../../sqlite/database';
import { generateId } from '../../sqlite/ids';
import { userPlatforms, users } from '../../sqlite/schema';
import { ApiErrorDetailCode } from '../../http/errors/error-codes';
import { NotFoundError } from '../../http/errors/http-errors';
import { ValidationError } from '../../http/errors/validation-errors';
import { ALLOWED_PLATFORMS, type Platform } from '../../http/helpers/platform';
import type { UserRepository } from '../user.repository';
import { isDuplicateKeyError } from '../helpers/duplicate-key-error';
import { DUMMY_PASSWORD_HASH, comparePassword, hashPassword } from '../helpers/user-auth';
import { USER_SETTINGS_KEYS, buildDefaultUserSettings, toUserSettingsRecord } from '../helpers/user-settings';
import { CODE_TTL_MS, generateVerificationCode } from '../helpers/verification-codes';
import { emailInUseError } from '../helpers/validators';
import {
  AdminUserListItem,
  AdminUserListQuery,
  PlatformActivityRecord,
  UserCreateInput,
  UserRecord,
  UserSettingsRecord,
} from '../helpers/types';

type UserRow = typeof users.$inferSelect;
type PlatformRow = typeof userPlatforms.$inferSelect;

const toPlatformsRecord = (rows: PlatformRow[]): Record<string, PlatformActivityRecord> => {
  return Object.fromEntries(rows.map((row) => [row.platform, {
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
    appVersion: row.appVersion,
  }]));
};

const toUserRecord = (user: UserRow, platforms: PlatformRow[]): UserRecord => {
  return {
    id: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
    hasLocalAccount: Boolean(user.password),
    googleId: user.googleId,
    emailVerificationCode: user.emailVerificationCode,
    emailVerificationExpires: user.emailVerificationExpires,
    emailVerificationCodeLastSentAt: user.emailVerificationCodeLastSentAt,
    emailVerificationAttempts: user.emailVerificationAttempts,
    existingAccountNoticeLastSentAt: user.existingAccountNoticeLastSentAt,
    newEmail: user.newEmail,
    newEmailVerificationCode: user.newEmailVerificationCode,
    newEmailVerificationExpires: user.newEmailVerificationExpires,
    newEmailVerificationAttempts: user.newEmailVerificationAttempts,
    oldEmails: [...user.oldEmails],
    passwordResetCode: user.passwordResetCode,
    passwordResetExpires: user.passwordResetExpires,
    passwordResetAttempts: user.passwordResetAttempts,
    tokenVersion: user.tokenVersion,
    settings: toUserSettingsRecord(user.settings),
    platforms: toPlatformsRecord(platforms),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/** Admin list sort columns; the route validates `sortOn` against the same names. */
const ADMIN_SORT_COLUMNS = {
  createdAt: users.createdAt,
  email: users.email,
};

export const createSqliteUserRepository = (db: SqliteDb): UserRepository => {
  const loadPlatforms = (userId: string): Promise<PlatformRow[]> =>
    db.select().from(userPlatforms).where(eq(userPlatforms.userId, userId));

  const findOne = async (where: SQL): Promise<UserRecord | null> => {
    const row = await db.select().from(users).where(where).limit(1).get();
    return row ? toUserRecord(row, await loadPlatforms(row.id)) : null;
  };

  const requireById = async (id: string): Promise<UserRecord> => {
    const user = await findOne(eq(users.id, id));
    if (!user) {
      throw new NotFoundError();
    }
    return user;
  };

  // Writes the given columns and advances updatedAt; throws if the user is gone.
  const update = async (id: string, fields: SQLiteUpdateSetSource<typeof users>): Promise<UserRecord> => {
    const updated = await db.update(users)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    if (!updated.length) {
      throw new NotFoundError();
    }
    return requireById(id);
  };

  // Atomically increments an attempt counter, returning the new value (0 if no such user).
  const incrementAttempts = async (
    id: string,
    key: 'passwordResetAttempts' | 'emailVerificationAttempts' | 'newEmailVerificationAttempts',
  ): Promise<number> => {
    const [row] = await db.update(users)
      .set({ [key]: sql`${users[key]} + 1`, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ value: users[key] });
    return row?.value ?? 0;
  };

  return {
    async findById(id: string): Promise<UserRecord | null> {
      return findOne(eq(users.id, id));
    },

    async findByEmail(email: string): Promise<UserRecord | null> {
      return findOne(eq(users.email, email.toLowerCase()));
    },

    async findByEmailVerificationCode(emailVerificationCode: string): Promise<UserRecord | null> {
      return findOne(eq(users.emailVerificationCode, emailVerificationCode));
    },

    async findByNewEmailVerificationCode(newEmailVerificationCode: string): Promise<UserRecord | null> {
      return findOne(eq(users.newEmailVerificationCode, newEmailVerificationCode));
    },

    async findByPasswordResetCode(passwordResetCode: string): Promise<UserRecord | null> {
      return findOne(eq(users.passwordResetCode, passwordResetCode));
    },

    async create(input: UserCreateInput): Promise<UserRecord> {
      const email = input.email.toLowerCase();

      // Enforce email uniqueness manually; the unique index remains as a
      // backstop against the read-then-write race below.
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
      if (existing) {
        throw emailInUseError();
      }

      // `null`/omitted creates an OAuth-only account without a local password.
      const password = input.password ? await hashPassword(input.password) : null;

      // An empty verification code marks the account as already verified.
      const emailVerificationCode = input.emailVerificationCode ?? generateVerificationCode();
      const now = new Date();

      const row: UserRow = {
        id: generateId(),
        email,
        isAdmin: Boolean(input.isAdmin),
        password,
        googleId: input.googleId ?? null,
        emailVerificationCode,
        emailVerificationExpires: new Date(Date.now() + CODE_TTL_MS),
        // Track when the initial verification email is sent so resend can enforce a cooldown.
        emailVerificationCodeLastSentAt: emailVerificationCode !== '' ? now : new Date(0),
        emailVerificationAttempts: 0,
        existingAccountNoticeLastSentAt: new Date(0),
        newEmail: null,
        newEmailVerificationCode: '',
        newEmailVerificationExpires: new Date(0),
        newEmailVerificationAttempts: 0,
        oldEmails: [],
        passwordResetCode: '',
        passwordResetExpires: new Date(0),
        passwordResetAttempts: 0,
        tokenVersion: 0,
        settings: buildDefaultUserSettings(input.locale),
        createdAt: now,
        updatedAt: now,
      };

      try {
        await db.insert(users).values(row);
      }
      catch (error) {
        if (isDuplicateKeyError(error)) {
          throw emailInUseError();
        }
        throw error;
      }
      return toUserRecord(row, []);
    },

    /**
     * Compares a plaintext password against the user's stored hash. Always runs
     * a bcrypt comparison (against a dummy hash when there is no local
     * password) so the response time doesn't reveal whether one exists.
     */
    async verifyPassword(userId: string, password: string): Promise<boolean> {
      const row = await db.select({ password: users.password }).from(users).where(eq(users.id, userId)).get();
      return comparePassword(password, row?.password || DUMMY_PASSWORD_HASH);
    },

    /**
     * Authenticates an email + password pair for login. Always performs a
     * bcrypt comparison so the response time can't be used to enumerate which
     * emails have accounts. Returns the user on success, or null.
     */
    async verifyLogin(email: string, password: string): Promise<UserRecord | null> {
      const row = await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
      const passwordValid = await comparePassword(password, row?.password || DUMMY_PASSWORD_HASH);
      if (!row || !passwordValid) {
        return null;
      }
      return toUserRecord(row, await loadPlatforms(row.id));
    },

    /** Sets a new password hash and bumps tokenVersion, revoking issued tokens. */
    async setPassword(userId: string, newPassword: string): Promise<UserRecord> {
      await requireById(userId);
      return update(userId, {
        password: await hashPassword(newPassword),
        tokenVersion: sql`${users.tokenVersion} + 1`,
      });
    },

    /** Bumps tokenVersion, revoking every previously issued JWT for this user. */
    async incrementTokenVersion(userId: string): Promise<UserRecord> {
      return update(userId, { tokenVersion: sql`${users.tokenVersion} + 1` });
    },

    /** Grants or revokes admin privileges for a user. */
    async setAdmin(userId: string, isAdmin: boolean): Promise<UserRecord> {
      return update(userId, { isAdmin });
    },

    async beginPasswordReset(userId: string): Promise<UserRecord> {
      return update(userId, {
        passwordResetCode: generateVerificationCode(),
        passwordResetExpires: new Date(Date.now() + CODE_TTL_MS),
        passwordResetAttempts: 0,
      });
    },

    /** Records a failed password-reset code submission and returns the new count. */
    async recordPasswordResetAttempt(userId: string): Promise<number> {
      return incrementAttempts(userId, 'passwordResetAttempts');
    },

    /** Sets the new password, clears the reset code, and bumps tokenVersion in one write. */
    async completePasswordReset(userId: string, newPassword: string): Promise<UserRecord> {
      await requireById(userId);
      return update(userId, {
        password: await hashPassword(newPassword),
        passwordResetCode: '',
        passwordResetExpires: new Date(0),
        passwordResetAttempts: 0,
        tokenVersion: sql`${users.tokenVersion} + 1`,
      });
    },

    /** Marks the user's email as verified by clearing the verification code. */
    async markEmailVerified(userId: string): Promise<UserRecord> {
      return update(userId, {
        emailVerificationCode: '',
        emailVerificationExpires: new Date(0),
        emailVerificationAttempts: 0,
      });
    },

    /** Records a failed email-verification code submission; returns the new count. */
    async recordEmailVerificationAttempt(userId: string): Promise<number> {
      return incrementAttempts(userId, 'emailVerificationAttempts');
    },

    async beginEmailUpdate(userId: string, newEmail: string): Promise<UserRecord> {
      // Any user may request any address; without owning it they can't verify it.
      return update(userId, {
        newEmail: newEmail.toLowerCase(),
        newEmailVerificationCode: generateVerificationCode(),
        newEmailVerificationExpires: new Date(Date.now() + CODE_TTL_MS),
        newEmailVerificationAttempts: 0,
      });
    },

    /** Records a failed change-email code submission; returns the new count. */
    async recordNewEmailVerificationAttempt(userId: string): Promise<number> {
      return incrementAttempts(userId, 'newEmailVerificationAttempts');
    },

    async cancelEmailUpdate(userId: string): Promise<void> {
      await update(userId, {
        newEmail: null,
        newEmailVerificationCode: '',
        newEmailVerificationExpires: new Date(0),
        newEmailVerificationAttempts: 0,
      });
    },

    /**
     * Applies the pending email change: archives the old email, promotes
     * newEmail, and clears the verification fields.
     */
    async completeEmailUpdate(userId: string): Promise<UserRecord> {
      const user = await requireById(userId);
      try {
        return await update(userId, {
          oldEmails: [...user.oldEmails, user.email],
          email: user.newEmail as string,
          newEmail: null,
          newEmailVerificationCode: '',
          newEmailVerificationExpires: new Date(0),
          newEmailVerificationAttempts: 0,
          googleId: null,
        });
      }
      catch (error) {
        // The route checks for an existing user first, but a concurrent change
        // could still claim the address; the unique index is the final guard.
        if (isDuplicateKeyError(error)) {
          throw new ValidationError([{ code: ApiErrorDetailCode.EmailInUse, field: null }]);
        }
        throw error;
      }
    },

    async resendEmailVerification(userId: string): Promise<UserRecord> {
      return update(userId, {
        emailVerificationCode: generateVerificationCode(),
        emailVerificationExpires: new Date(Date.now() + CODE_TTL_MS),
        emailVerificationCodeLastSentAt: new Date(),
        emailVerificationAttempts: 0,
      });
    },

    async recordExistingAccountNotice(userId: string): Promise<void> {
      await update(userId, { existingAccountNoticeLastSentAt: new Date() });
    },

    async linkGoogleAccount(userId: string, googleId: string): Promise<void> {
      await update(userId, { googleId });
    },

    /**
     * Records that this user was seen on `platform` running `appVersion`:
     * refreshes `lastSeenAt`/`appVersion` and keeps the earliest `firstSeenAt`.
     * Deliberately does not bump `updatedAt` (activity isn't a profile edit),
     * and is a no-op for a missing user.
     */
    async recordClientActivity(userId: string, platform: string, appVersion: string | null, now = new Date()): Promise<void> {
      const exists = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).get();
      if (!exists) {
        return;
      }
      await db.insert(userPlatforms)
        .values({ userId, platform, firstSeenAt: now, lastSeenAt: now, appVersion })
        .onConflictDoUpdate({
          target: [userPlatforms.userId, userPlatforms.platform],
          set: {
            firstSeenAt: sql`min(${userPlatforms.firstSeenAt}, excluded.first_seen_at)`,
            lastSeenAt: sql`excluded.last_seen_at`,
            appVersion: sql`excluded.app_version`,
          },
        });
    },

    async updateSettings(userId: string, patch: Partial<UserSettingsRecord>): Promise<UserSettingsRecord> {
      const user = await requireById(userId);
      const changes: Partial<UserSettingsRecord> = {};
      for (const key of USER_SETTINGS_KEYS) {
        if (typeof patch[key] !== 'undefined') {
          (changes as Record<string, unknown>)[key] = patch[key];
        }
      }

      // If nothing to change, return current settings
      if (Object.keys(changes).length === 0) {
        return user.settings;
      }

      // Values are already validated by zod in the route handler.
      const updated = await update(userId, { settings: { ...user.settings, ...changes } });
      return updated.settings;
    },

    async deleteById(id: string): Promise<boolean> {
      const deleted = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
      return deleted.length > 0;
    },

    async countCreatedBetween(start: Date, end: Date): Promise<number> {
      const result = await db.select({ value: count() }).from(users)
        .where(and(gte(users.createdAt, start), lte(users.createdAt, end)))
        .get();
      return result?.value ?? 0;
    },

    /**
     * New-account counts for `[start, end]`, broken down by the platform(s)
     * recorded against each user. A user seen on two platforms counts under
     * both, so the counts can sum to more than `countCreatedBetween`.
     */
    async countCreatedBetweenByPlatform(start: Date, end: Date): Promise<Record<Platform, number>> {
      const rows = await db.select({ platform: userPlatforms.platform, value: count() })
        .from(userPlatforms)
        .innerJoin(users, eq(users.id, userPlatforms.userId))
        .where(and(gte(users.createdAt, start), lte(users.createdAt, end)))
        .groupBy(userPlatforms.platform);
      const counts = Object.fromEntries(rows.map((row) => [row.platform, row.value]));
      return Object.fromEntries(ALLOWED_PLATFORMS.map((platform) => [platform, counts[platform] ?? 0])) as Record<Platform, number>;
    },

    async listAdminUsers(query: AdminUserListQuery): Promise<{ users: AdminUserListItem[]; total: number }> {
      // Case-insensitive literal substring match; emails are stored lowercase
      // and instr has no wildcard characters to escape.
      const where = query.searchText
        ? sql`instr(${users.email}, ${query.searchText.toLowerCase()}) > 0`
        : undefined;
      const sortColumn = ADMIN_SORT_COLUMNS[query.sortOn as keyof typeof ADMIN_SORT_COLUMNS] ?? users.createdAt;
      const direction = query.sortDirection === 1 ? asc : desc;

      const [rows, totalRow] = await Promise.all([
        db.select().from(users).where(where)
          .orderBy(direction(sortColumn), asc(users.id))
          .limit(query.limit)
          .offset(query.offset),
        db.select({ value: count() }).from(users).where(where).get(),
      ]);

      const platformRows = rows.length
        ? await db.select().from(userPlatforms).where(inArray(userPlatforms.userId, rows.map((row) => row.id)))
        : [];

      const items = rows.map((row) => {
        const {
          // Sensitive fields the admin list never exposes.
          emailVerificationCode: _emailVerificationCode,
          newEmailVerificationCode: _newEmailVerificationCode,
          newEmailVerificationExpires: _newEmailVerificationExpires,
          passwordResetCode: _passwordResetCode,
          passwordResetExpires: _passwordResetExpires,
          ...rest
        } = toUserRecord(row, platformRows.filter((platformRow) => platformRow.userId === row.id));
        return rest;
      });

      return { users: items, total: totalRow?.value ?? 0 };
    },

    /** Returns the email addresses of every admin account. */
    async listAdminEmails(): Promise<string[]> {
      const admins = await db.select({ email: users.email }).from(users).where(eq(users.isAdmin, true));
      return admins.map((admin) => admin.email);
    },

    /** Returns the minimal `{ _id, email }` shape the admin user detail endpoint responds with. */
    async getAdminUserSummary(email: string): Promise<{ _id: string; email: string } | null> {
      const row = await db.select({ id: users.id, email: users.email }).from(users)
        .where(eq(users.email, email.toLowerCase()))
        .get();
      return row ? { _id: row.id, email: row.email } : null;
    },
  };
};
