import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import type useMongooseModels from '../mongoose/useMongooseModels';
import UserSettings from '../mongoose/schemas/UserSettings';
import { ApiErrorDetailCode } from '../router/errors/error-codes';
import { NotFoundError } from '../router/errors/http-errors';
import { ValidationError } from '../router/errors/validation-errors';
import { isDuplicateKeyError } from './duplicate-key-error';
import {
  AdminUserListItem,
  AdminUserListQuery,
  UserCreateInput,
  UserRecord,
  UserSettingsRecord,
} from './types';

type Models = Awaited<ReturnType<typeof useMongooseModels>>;
type UserDoc = ReturnType<Models['User']['hydrate']>;

const USER_SETTINGS_KEYS: (keyof UserSettingsRecord)[] = [
  'dailyVerseCountGoal',
  'lookBackDate',
  'preferredBibleVersion',
  'startPage',
  'passageNoteTagSortOrder',
  'locale',
];

const toUserSettingsRecord = (settings: UserDoc['settings']): UserSettingsRecord => {
  return {
    dailyVerseCountGoal: settings.dailyVerseCountGoal,
    lookBackDate: settings.lookBackDate,
    preferredBibleVersion: settings.preferredBibleVersion,
    startPage: settings.startPage,
    passageNoteTagSortOrder: settings.passageNoteTagSortOrder,
    locale: settings.locale,
  };
};

const toUserRecord = (user: UserDoc): UserRecord => {
  return {
    id: user._id.toString(),
    email: user.email,
    isAdmin: user.isAdmin,
    hasLocalAccount: Boolean(user.password),
    googleId: user.googleId ?? null,
    emailVerificationCode: user.emailVerificationCode,
    emailVerificationExpires: user.emailVerificationExpires,
    emailVerificationCodeLastSentAt: user.emailVerificationCodeLastSentAt,
    newEmail: user.newEmail ?? null,
    newEmailVerificationCode: user.newEmailVerificationCode,
    newEmailVerificationExpires: user.newEmailVerificationExpires,
    oldEmails: [...user.oldEmails],
    passwordResetCode: user.passwordResetCode,
    passwordResetExpires: user.passwordResetExpires,
    settings: toUserSettingsRecord(user.settings),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const generateVerificationCode = () => crypto.randomBytes(64).toString('hex');

const emailInUseError = () =>
  new ValidationError([{ code: ApiErrorDetailCode.EmailInUse, field: 'email' }]);

export const createUserRepository = ({ User }: Models) => {
  const requireDocById = async (id: string): Promise<UserDoc> => {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError();
    }
    return user;
  };

  return {
    async findById(id: string): Promise<UserRecord | null> {
      const user = await User.findById(id);
      return user && toUserRecord(user);
    },

    async findByEmail(email: string): Promise<UserRecord | null> {
      const user = await User.findOne({ email });
      return user && toUserRecord(user);
    },

    async findByEmailVerificationCode(emailVerificationCode: string): Promise<UserRecord | null> {
      const user = await User.findOne({ emailVerificationCode });
      return user && toUserRecord(user);
    },

    async findByNewEmailVerificationCode(newEmailVerificationCode: string): Promise<UserRecord | null> {
      const user = await User.findOne({ newEmailVerificationCode });
      return user && toUserRecord(user);
    },

    async findByPasswordResetCode(passwordResetCode: string): Promise<UserRecord | null> {
      const user = await User.findOne({ passwordResetCode });
      return user && toUserRecord(user);
    },

    async create(input: UserCreateInput): Promise<UserRecord> {
      // Enforce email uniqueness manually; the unique index remains as a
      // backstop against the read-then-write race below.
      const existing = await User.findOne({ email: input.email }).select({ _id: 1 });
      if (existing) {
        throw emailInUseError();
      }

      const user = new User();
      user.email = input.email;
      if (input.password !== undefined) {
        user.password = input.password;
      }
      // remaining settings will be set by Mongoose default
      user.settings = new UserSettings({ locale: input.locale });
      if (input.googleId !== undefined) {
        user.googleId = input.googleId;
      }
      if (input.emailVerificationCode !== undefined) {
        // setting emailVerificationCode to '' will mark the user as email verified
        user.emailVerificationCode = input.emailVerificationCode;
      }
      // Track when the initial verification email is sent so resend can enforce a cooldown
      if (user.emailVerificationCode !== '') {
        user.emailVerificationCodeLastSentAt = new Date();
      }
      if (input.isAdmin) {
        user.isAdmin = true;
      }
      try {
        await user.save();
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
     * Compares a plaintext password against the user's stored hash.
     * Resolves false for users without a local password.
     */
    async verifyPassword(userId: string, password: string): Promise<boolean> {
      const user = await User.findById(userId);
      const userPassword = user?.password ?? '';
      if (!userPassword) {
        return false;
      }
      return new Promise((resolve) => {
        bcrypt.compare(password, userPassword, function(err, isMatch) {
          if (err) {
            resolve(false);
          }
          else {
            resolve(isMatch);
          }
        });
      });
    },

    async setPassword(userId: string, newPassword: string): Promise<void> {
      const user = await requireDocById(userId);
      user.password = newPassword;
      await user.save();
    },

    async beginPasswordReset(userId: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.passwordResetCode = generateVerificationCode();
      user.passwordResetExpires = new Date(Date.now() + (60 * 60 * 1000)); // in 1 hour
      await user.save();
      return toUserRecord(user);
    },

    /** Sets the new password and clears the password reset code in one save. */
    async completePasswordReset(userId: string, newPassword: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.password = newPassword;
      user.passwordResetCode = '';
      user.passwordResetExpires = new Date(0);
      await user.save();
      return toUserRecord(user);
    },

    /** Marks the user's email as verified by clearing the verification code. */
    async markEmailVerified(userId: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      user.emailVerificationCode = '';
      user.emailVerificationExpires = new Date(0);
      await user.save();
      return toUserRecord(user);
    },

    async beginEmailUpdate(userId: string, newEmail: string): Promise<UserRecord> {
      const user = await requireDocById(userId);
      // Allow any user to request to change their email address to any
      // other email address -- if they don't own that other email address,
      // they simply won't be able to take control of it.
      user.newEmail = newEmail;
      user.newEmailVerificationCode = generateVerificationCode();
      user.newEmailVerificationExpires = new Date(Date.now() + (60 * 60 * 1000)); // in 1 hour
      await user.save();
      return toUserRecord(user);
    },

    async cancelEmailUpdate(userId: string): Promise<void> {
      const user = await requireDocById(userId);
      user.newEmail = null;
      user.newEmailVerificationCode = '';
      user.newEmailVerificationExpires = new Date(0);
      await user.save();
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
      try {
        await user.save();
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
      await user.save();
      return toUserRecord(user);
    },

    async linkGoogleAccount(userId: string, googleId: string): Promise<void> {
      const user = await requireDocById(userId);
      user.googleId = googleId;
      await user.save();
    },

    async updateSettings(userId: string, patch: Partial<UserSettingsRecord>): Promise<UserSettingsRecord> {
      const set: Record<string, string | number> = {};
      for (const key of USER_SETTINGS_KEYS) {
        if (typeof patch[key] !== 'undefined') {
          set[`settings.${key}`] = patch[key];
        }
      }

      // If nothing to change, return current settings
      if (Object.keys(set).length === 0) {
        const user = await requireDocById(userId);
        return toUserSettingsRecord(user.settings);
      }

      // Perform an atomic update so we don't trigger full-document
      // validation or `pre('save')` hooks that touch unrelated fields.
      // Values are already validated by zod in the route handler.
      await User.updateOne({ _id: userId }, { $set: set }).exec();
      const updated = await requireDocById(userId);
      return toUserSettingsRecord(updated.settings);
    },

    async deleteById(id: string): Promise<boolean> {
      const result = await User.deleteOne({ _id: id });
      return result.deletedCount > 0;
    },

    async countCreatedBetween(start: Date, end: Date): Promise<number> {
      return User.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end,
        },
      }).exec();
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

      const users = await User
        .aggregate([
          { $match: filterQuery },
          { $sort: sortQuery },
          { $skip: query.offset },
          { $limit: query.limit },
          {
            $addFields: {
              id: '$_id',
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
        ]);

      // Count the total number of results for all applied filters
      const total = await User.countDocuments(filterQuery);

      return {
        users: users.map((user) => ({ ...user, id: String(user.id) })),
        total,
      };
    },

    /**
     * Returns the minimal `{ _id, email }` shape the admin user detail
     * endpoint has always responded with.
     */
    async getAdminUserSummary(email: string): Promise<{ _id: string; email: string } | null> {
      const user = await User
        .findOne({ email })
        .select({ email: 1 })
        .exec();
      if (!user) {
        return null;
      }
      return { _id: user._id.toString(), email: user.email };
    },
  };
};

export type UserRepository = ReturnType<typeof createUserRepository>;
