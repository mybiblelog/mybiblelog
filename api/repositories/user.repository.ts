import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import type { Collections } from '../mongo/useCollections';
import type { UserDocument, UserSettingsDocument } from '../mongo/documents';
import { ApiErrorDetailCode } from '../http/errors/error-codes';
import { NotFoundError } from '../http/errors/http-errors';
import { ValidationError } from '../http/errors/validation-errors';
import { isDuplicateKeyError } from './helpers/duplicate-key-error';
import { hashPassword } from './helpers/user-auth';
import { buildDefaultUserSettings } from './helpers/user-settings';
import {
  AdminUserListItem,
  AdminUserListQuery,
  UserCreateInput,
  UserRecord,
  UserSettingsRecord,
} from './helpers/types';

const USER_SETTINGS_KEYS: (keyof UserSettingsRecord)[] = [
  'dailyVerseCountGoal',
  'lookBackDate',
  'preferredBibleVersion',
  'startPage',
  'passageNoteTagSortOrder',
  'locale',
];

const toUserSettingsRecord = (settings: UserSettingsDocument): UserSettingsRecord => {
  return {
    dailyVerseCountGoal: settings.dailyVerseCountGoal,
    lookBackDate: settings.lookBackDate,
    preferredBibleVersion: settings.preferredBibleVersion,
    startPage: settings.startPage,
    passageNoteTagSortOrder: settings.passageNoteTagSortOrder,
    locale: settings.locale,
  };
};

const toUserRecord = (user: UserDocument): UserRecord => {
  return {
    id: user._id.toString(),
    email: user.email,
    isAdmin: user.isAdmin,
    hasLocalAccount: Boolean(user.password),
    googleId: user.googleId ?? null,
    emailVerificationCode: user.emailVerificationCode,
    emailVerificationExpires: user.emailVerificationExpires,
    emailVerificationCodeLastSentAt: user.emailVerificationCodeLastSentAt,
    // Default legacy documents (created before this field existed) to the epoch
    // so the notice cooldown treats them as "never sent".
    existingAccountNoticeLastSentAt: user.existingAccountNoticeLastSentAt ?? new Date(0),
    newEmail: user.newEmail ?? null,
    newEmailVerificationCode: user.newEmailVerificationCode,
    newEmailVerificationExpires: user.newEmailVerificationExpires,
    oldEmails: [...user.oldEmails],
    passwordResetCode: user.passwordResetCode,
    passwordResetExpires: user.passwordResetExpires,
    // Default legacy documents (created before this field existed) to 0 so their
    // still-valid tokens (which also carry no version) continue to match.
    tokenVersion: user.tokenVersion ?? 0,
    settings: toUserSettingsRecord(user.settings),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const generateVerificationCode = () => crypto.randomBytes(64).toString('hex');

// A precomputed bcrypt hash used as a constant-time stand-in when an account
// (or its local password) is absent. Comparing every credential check against a
// real hash keeps the work — and therefore the response time — identical
// whether or not the email exists, defeating timing-based user enumeration.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('mybiblelog-timing-safe-dummy-password', 10);

// Wraps bcrypt.compare in a boolean promise, treating any comparison error as a
// non-match rather than surfacing it.
const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash).then((isMatch) => isMatch, () => false);

const emailInUseError = () =>
  new ValidationError([{ code: ApiErrorDetailCode.EmailInUse, field: 'email' }]);

export const createUserRepository = ({ users }: Collections) => {
  const requireDocById = async (id: string): Promise<UserDocument> => {
    const user = await users.findOne({ _id: new ObjectId(id) });
    if (!user) {
      throw new NotFoundError();
    }
    return user;
  };

  // Persists the given subset of fields, advancing updatedAt (Mongoose used to
  // maintain timestamps automatically).
  const persist = async (user: UserDocument, fields: Partial<UserDocument>): Promise<void> => {
    user.updatedAt = new Date();
    await users.updateOne({ _id: user._id }, { $set: { ...fields, updatedAt: user.updatedAt } });
  };

  return {
    async findById(id: string): Promise<UserRecord | null> {
      const user = await users.findOne({ _id: new ObjectId(id) });
      return user && toUserRecord(user);
    },

    async findByEmail(email: string): Promise<UserRecord | null> {
      const user = await users.findOne({ email: email.toLowerCase() });
      return user && toUserRecord(user);
    },

    async findByEmailVerificationCode(emailVerificationCode: string): Promise<UserRecord | null> {
      const user = await users.findOne({ emailVerificationCode });
      return user && toUserRecord(user);
    },

    async findByNewEmailVerificationCode(newEmailVerificationCode: string): Promise<UserRecord | null> {
      const user = await users.findOne({ newEmailVerificationCode });
      return user && toUserRecord(user);
    },

    async findByPasswordResetCode(passwordResetCode: string): Promise<UserRecord | null> {
      const user = await users.findOne({ passwordResetCode });
      return user && toUserRecord(user);
    },

    async create(input: UserCreateInput): Promise<UserRecord> {
      const email = input.email.toLowerCase();

      // Enforce email uniqueness manually; the unique index remains as a
      // backstop against the read-then-write race below.
      const existing = await users.findOne({ email }, { projection: { _id: 1 } });
      if (existing) {
        throw emailInUseError();
      }

      // Allow `null` to be set explicitly to create an OAuth-only account
      // without a local password. A real password is hashed before saving
      // (replacing the User pre-save hook); null/omitted is stored as null.
      let password: string | null = null;
      if (input.password) {
        password = await hashPassword(input.password);
      }

      // An empty verification code marks the account as already verified.
      const emailVerificationCode = input.emailVerificationCode ?? generateVerificationCode();
      const now = new Date();

      const user: UserDocument = {
        _id: new ObjectId(),
        email,
        isAdmin: Boolean(input.isAdmin),
        password,
        googleId: input.googleId ?? null,
        emailVerificationCode,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        // Track when the initial verification email is sent so resend can enforce a cooldown.
        emailVerificationCodeLastSentAt: emailVerificationCode !== '' ? now : new Date(0),
        existingAccountNoticeLastSentAt: new Date(0),
        newEmail: null,
        newEmailVerificationCode: '',
        newEmailVerificationExpires: new Date(0),
        oldEmails: [],
        passwordResetCode: '',
        passwordResetExpires: new Date(0),
        tokenVersion: 0,
        settings: buildDefaultUserSettings(input.locale),
        createdAt: now,
        updatedAt: now,
      };

      try {
        await users.insertOne(user);
      }
      catch (error) {
        if (isDuplicateKeyError(error)) {
          throw emailInUseError();
        }
        throw error;
      }
      return toUserRecord(user);
    },

    /**
     * Compares a plaintext password against the user's stored hash. Always runs
     * a bcrypt comparison — against a dummy hash when there is no local password
     * — so accounts without a local password take the same time as those with
     * one, avoiding a timing oracle. Resolves false when the password does not
     * match (including for users without a local password).
     */
    async verifyPassword(userId: string, password: string): Promise<boolean> {
      const user = await users.findOne({ _id: new ObjectId(userId) });
      return comparePassword(password, user?.password || DUMMY_PASSWORD_HASH);
    },

    /**
     * Authenticates an email + password pair for login. Always performs a
     * bcrypt comparison — against a dummy hash when the email is unknown or the
     * account has no local password — so every attempt does equivalent work and
     * the response time cannot be used to enumerate which emails have accounts.
     * Returns the user on success, or null when the credentials are invalid.
     */
    async verifyLogin(email: string, password: string): Promise<UserRecord | null> {
      const user = await users.findOne({ email: email.toLowerCase() });
      const passwordValid = await comparePassword(password, user?.password || DUMMY_PASSWORD_HASH);
      if (!user || !passwordValid) {
        return null;
      }
      return toUserRecord(user);
    },

    /**
     * Sets a new password hash and bumps tokenVersion in one write so any
     * previously issued token is revoked. Returns the updated record so the
     * caller can re-mint the acting session's token (keeping it signed in).
     */
    async setPassword(userId: string, newPassword: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.password = await hashPassword(newPassword);
      await users.updateOne(
        { _id: user._id },
        { $set: { password: user.password, updatedAt: new Date() }, $inc: { tokenVersion: 1 } },
      );
      return toUserRecord(await requireDocById(userId));
    },

    /**
     * Bumps tokenVersion, revoking every previously issued JWT for this user.
     * Backs the "log out all sessions" action; the caller re-mints a token for
     * the acting device so it stays signed in.
     */
    async incrementTokenVersion(userId: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      await users.updateOne(
        { _id: user._id },
        { $set: { updatedAt: new Date() }, $inc: { tokenVersion: 1 } },
      );
      return toUserRecord(await requireDocById(userId));
    },

    /** Grants or revokes admin privileges for a user. */
    async setAdmin(userId: string, isAdmin: boolean): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.isAdmin = isAdmin;
      await persist(user, { isAdmin: user.isAdmin });
      return toUserRecord(user);
    },

    async beginPasswordReset(userId: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.passwordResetCode = generateVerificationCode();
      user.passwordResetExpires = new Date(Date.now() + (60 * 60 * 1000)); // in 1 hour
      await persist(user, { passwordResetCode: user.passwordResetCode, passwordResetExpires: user.passwordResetExpires });
      return toUserRecord(user);
    },

    /**
     * Sets the new password, clears the reset code, and bumps tokenVersion (so
     * any token stolen before the reset is revoked) in one write.
     */
    async completePasswordReset(userId: string, newPassword: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.password = await hashPassword(newPassword);
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            password: user.password,
            passwordResetCode: '',
            passwordResetExpires: new Date(0),
            updatedAt: new Date(),
          },
          $inc: { tokenVersion: 1 },
        },
      );
      return toUserRecord(await requireDocById(userId));
    },

    /** Marks the user's email as verified by clearing the verification code. */
    async markEmailVerified(userId: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.emailVerificationCode = '';
      user.emailVerificationExpires = new Date(0);
      await persist(user, { emailVerificationCode: user.emailVerificationCode, emailVerificationExpires: user.emailVerificationExpires });
      return toUserRecord(user);
    },

    async beginEmailUpdate(userId: string, newEmail: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      // Allow any user to request to change their email address to any
      // other email address -- if they don't own that other email address,
      // they simply won't be able to take control of it.
      user.newEmail = newEmail.toLowerCase();
      user.newEmailVerificationCode = generateVerificationCode();
      user.newEmailVerificationExpires = new Date(Date.now() + (60 * 60 * 1000)); // in 1 hour
      await persist(user, {
        newEmail: user.newEmail,
        newEmailVerificationCode: user.newEmailVerificationCode,
        newEmailVerificationExpires: user.newEmailVerificationExpires,
      });
      return toUserRecord(user);
    },

    async cancelEmailUpdate(userId: string): Promise<void> {
      const user = await requireDocById(userId);
      user.newEmail = null;
      user.newEmailVerificationCode = '';
      user.newEmailVerificationExpires = new Date(0);
      await persist(user, {
        newEmail: user.newEmail,
        newEmailVerificationCode: user.newEmailVerificationCode,
        newEmailVerificationExpires: user.newEmailVerificationExpires,
      });
    },

    /**
     * Applies the pending email change: archives the old email, promotes
     * newEmail, and clears the verification fields.
     */
    async completeEmailUpdate(userId: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.oldEmails.push(user.email);
      user.email = user.newEmail as string;
      user.newEmail = null;
      user.newEmailVerificationCode = '';
      user.newEmailVerificationExpires = new Date(0);
      user.googleId = null;
      try {
        await persist(user, {
          oldEmails: user.oldEmails,
          email: user.email,
          newEmail: user.newEmail,
          newEmailVerificationCode: user.newEmailVerificationCode,
          newEmailVerificationExpires: user.newEmailVerificationExpires,
          googleId: user.googleId,
        });
      }
      catch (error) {
        // The route checks for an existing user before completing, but a
        // concurrent change could still claim the address first; the unique
        // index is the authoritative guard.
        if (isDuplicateKeyError(error)) {
          throw new ValidationError([{ code: ApiErrorDetailCode.EmailInUse, field: null }]);
        }
        throw error;
      }
      return toUserRecord(user);
    },

    async resendEmailVerification(userId: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.emailVerificationCode = generateVerificationCode();
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.emailVerificationCodeLastSentAt = new Date();
      await persist(user, {
        emailVerificationCode: user.emailVerificationCode,
        emailVerificationExpires: user.emailVerificationExpires,
        emailVerificationCodeLastSentAt: user.emailVerificationCodeLastSentAt,
      });
      return toUserRecord(user);
    },

    async recordExistingAccountNotice(userId: string): Promise<void> {
      const user = await requireDocById(userId);
      user.existingAccountNoticeLastSentAt = new Date();
      await persist(user, {
        existingAccountNoticeLastSentAt: user.existingAccountNoticeLastSentAt,
      });
    },

    async linkGoogleAccount(userId: string, googleId: string): Promise<void> {
      const user = await requireDocById(userId);
      user.googleId = googleId;
      await persist(user, { googleId: user.googleId });
    },

    async updateSettings(userId: string, patch: Partial<UserSettingsRecord>): Promise<UserSettingsRecord> {
      const set: Record<string, string | number> = {};
      for (const key of USER_SETTINGS_KEYS) {
        if (typeof patch[key] !== 'undefined') {
          set[`settings.${key}`] = patch[key] as string | number;
        }
      }

      // If nothing to change, return current settings
      if (Object.keys(set).length === 0) {
        const user = await requireDocById(userId);
        return toUserSettingsRecord(user.settings);
      }

      // Values are already validated by zod in the route handler.
      await users.updateOne({ _id: new ObjectId(userId) }, { $set: { ...set, updatedAt: new Date() } });
      const updated = await requireDocById(userId);
      return toUserSettingsRecord(updated.settings);
    },

    async deleteById(id: string): Promise<boolean> {
      const result = await users.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    },

    async countCreatedBetween(start: Date, end: Date): Promise<number> {
      return users.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      });
    },

    async listAdminUsers(query: AdminUserListQuery): Promise<{ users: AdminUserListItem[]; total: number }> {
      const filterQuery: Record<string, unknown> = {}; // all users

      if (query.searchText) {
        // Escape special regex characters to prevent injection
        const escapedSearchText = query.searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filterQuery.email = { $regex: escapedSearchText, $options: 'i' };
      }

      const sortQuery: Record<string, 1 | -1> = {
        [query.sortOn]: query.sortDirection,
      };

      const results = await users
        .aggregate<AdminUserListItem & { id: ObjectId }>([
          { $match: filterQuery },
          { $sort: sortQuery },
          { $skip: query.offset },
          { $limit: query.limit },
          {
            $addFields: {
              id: '$_id',
              hasLocalAccount: { $ne: ['$password', null] },
            },
          },
          {
            $project: {
              _id: 0,
              __v: 0,
              emailVerificationCode: 0,
              newEmailVerificationCode: 0,
              newEmailVerificationExpires: 0,
              password: 0,
              passwordResetCode: 0,
              passwordResetExpires: 0,
            },
          },
        ])
        .toArray();

      // Count the total number of results for all applied filters
      const total = await users.countDocuments(filterQuery);

      return {
        users: results.map((user) => ({ ...user, id: String(user.id) })),
        total,
      };
    },

    /** Returns the email addresses of every admin account. */
    async listAdminEmails(): Promise<string[]> {
      const admins = await users.find({ isAdmin: true }, { projection: { email: 1 } }).toArray();
      return admins.map((admin) => admin.email);
    },

    /**
     * Returns the minimal `{ _id, email }` shape the admin user detail
     * endpoint has always responded with.
     */
    async getAdminUserSummary(email: string): Promise<{ _id: string; email: string } | null> {
      const user = await users.findOne({ email: email.toLowerCase() }, { projection: { email: 1 } });
      if (!user) {
        return null;
      }
      return { _id: user._id.toString(), email: user.email };
    },
  };
};

export type UserRepository = ReturnType<typeof createUserRepository>;
