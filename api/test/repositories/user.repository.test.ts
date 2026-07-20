import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { ValidationError } from '../../http/errors/validation-errors';
import { NotFoundError } from '../../http/errors/http-errors';
import type { UserCreateInput, UserRecord } from '../../repositories/helpers/types';
import {
  getRepos,
  getCollections,
  ensureIndexes,
  clearCollections,
  uniqueEmail,
  sleep,
  expectObjectId,
} from './helpers';

/** Creates a user, supplying the required defaults (locale is mandatory and has no schema default). */
const createUser = async (overrides: Partial<UserCreateInput> = {}): Promise<UserRecord> => {
  const { users } = await getRepos();
  return users.create({ email: uniqueEmail(), password: 'password123', locale: 'en', ...overrides });
};

describe('user.repository', () => {
  beforeAll(async () => {
    // The duplicate-email backstop relies on the unique index existing.
    await ensureIndexes();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  describe('create', () => {
    it('creates a user with an ObjectId id, lowercased email, default settings and timestamps', async () => {
      const email = uniqueEmail().toUpperCase();

      const user = await createUser({ email });

      expectObjectId(user.id);
      expect(user.email).toBe(email.toLowerCase());
      expect(user.isAdmin).toBe(false);
      expect(user.hasLocalAccount).toBe(true);
      expect(user.googleId).toBeNull();
      expect(user.settings.locale).toBe('en');
      expect(user.settings.dailyVerseCountGoal).toBe(86);
      expect(user.tokenVersion).toBe(0);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('creates an OAuth-only account (password null) with no local account', async () => {
      const { users } = await getRepos();

      // This is the exact shape the Google OAuth signup handler uses.
      const user = await users.create({
        email: uniqueEmail(),
        password: null,
        googleId: 'google-123',
        emailVerificationCode: '', // Google-verified emails skip verification
        locale: 'en',
      });

      expect(user.hasLocalAccount).toBe(false);
      expect(user.googleId).toBe('google-123');
      expect(await users.verifyPassword(user.id, 'anything')).toBe(false);
    });

    it('creates an account with no local password when password is omitted', async () => {
      const { users } = await getRepos();

      const user = await users.create({ email: uniqueEmail(), googleId: 'google-456', locale: 'en' });

      expect(user.hasLocalAccount).toBe(false);
    });

    it('marks the user verified when emailVerificationCode is empty', async () => {
      const user = await createUser({ emailVerificationCode: '' });

      expect(user.emailVerificationCode).toBe('');
      // No verification email was sent, so the "last sent" stamp stays at the epoch.
      expect(user.emailVerificationCodeLastSentAt.getTime()).toBe(0);
    });

    it('generates a verification code and records the send time when not verified', async () => {
      const user = await createUser();

      expect(user.emailVerificationCode).toMatch(/^\d{6}$/); // short numeric code
      expect(user.emailVerificationCodeLastSentAt.getTime()).toBeGreaterThan(0);
    });

    it('rejects a duplicate email with a ValidationError (pre-insert check)', async () => {
      const email = uniqueEmail();
      await createUser({ email });

      await expect(createUser({ email })).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('password hashing (pre-save hook)', () => {
    it('stores a bcrypt hash rather than the plaintext password', async () => {
      const { users } = await getCollections();

      const user = await createUser();

      const doc = await users.findOne({ _id: new ObjectId(user.id) });
      expect(doc?.password).toBeTruthy();
      expect(doc?.password).not.toBe('password123');
      expect(doc?.password?.startsWith('$2')).toBe(true);
    });

    it('verifyPassword matches the correct password and rejects a wrong one', async () => {
      const { users } = await getRepos();
      const user = await createUser();

      expect(await users.verifyPassword(user.id, 'password123')).toBe(true);
      expect(await users.verifyPassword(user.id, 'wrong-password')).toBe(false);
    });

    it('verifyLogin returns the user for valid credentials and null otherwise', async () => {
      const { users } = await getRepos();
      const email = uniqueEmail();
      const user = await createUser({ email });

      expect((await users.verifyLogin(email, 'password123'))?.id).toBe(user.id);
      expect(await users.verifyLogin(email, 'wrong-password')).toBeNull();
    });

    it('verifyLogin returns null (running a comparison) for an unknown email', async () => {
      const { users } = await getRepos();
      expect(await users.verifyLogin(uniqueEmail(), 'password123')).toBeNull();
    });

    it('verifyLogin returns null for an account with no local password', async () => {
      const { users } = await getRepos();
      const email = uniqueEmail();
      await users.create({ email, googleId: 'google-789', emailVerificationCode: '', locale: 'en' });

      expect(await users.verifyLogin(email, 'anything')).toBeNull();
    });

    it('setPassword re-hashes, bumps tokenVersion, advances updatedAt, and keeps createdAt stable', async () => {
      const { users } = await getRepos();
      const created = await createUser();

      await sleep(10);
      const returned = await users.setPassword(created.id, 'newpassword456');

      expect(await users.verifyPassword(created.id, 'newpassword456')).toBe(true);
      expect(await users.verifyPassword(created.id, 'password123')).toBe(false);

      // Returns the updated record with an advanced tokenVersion so the caller
      // can re-mint the acting session's token.
      expect(returned.tokenVersion).toBe(created.tokenVersion + 1);

      const updated = await users.findById(created.id);
      expect(updated!.tokenVersion).toBe(created.tokenVersion + 1);
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      expect(updated!.createdAt.getTime()).toBe(created.createdAt.getTime());
    });

    it('incrementTokenVersion bumps tokenVersion, revoking previously issued tokens', async () => {
      const { users } = await getRepos();
      const created = await createUser();

      const returned = await users.incrementTokenVersion(created.id);

      expect(returned.tokenVersion).toBe(created.tokenVersion + 1);
      expect((await users.findById(created.id))!.tokenVersion).toBe(created.tokenVersion + 1);
    });
  });

  describe('lookups', () => {
    it('finds users by id, email, and the various verification/reset codes', async () => {
      const { users } = await getRepos();
      const email = uniqueEmail();
      const created = await createUser({ email });

      expect((await users.findById(created.id))?.id).toBe(created.id);
      expect((await users.findByEmail(email))?.id).toBe(created.id);
      expect((await users.findByEmailVerificationCode(created.emailVerificationCode))?.id).toBe(created.id);

      const reset = await users.beginPasswordReset(created.id);
      expect((await users.findByPasswordResetCode(reset.passwordResetCode))?.id).toBe(created.id);
    });

    it('returns null for a missing user', async () => {
      const { users } = await getRepos();
      expect(await users.findById(new ObjectId().toString())).toBeNull();
    });
  });

  describe('password reset flow', () => {
    it('issues a reset code then clears it on completion', async () => {
      const { users } = await getRepos();
      const created = await createUser();

      const reset = await users.beginPasswordReset(created.id);
      expect(reset.passwordResetCode).not.toBe('');
      expect(reset.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());

      const completed = await users.completePasswordReset(created.id, 'newpassword456');
      expect(completed.passwordResetCode).toBe('');
      // Bumps tokenVersion so any token stolen before the reset is revoked.
      expect(completed.tokenVersion).toBe(created.tokenVersion + 1);
      expect(await users.verifyPassword(created.id, 'newpassword456')).toBe(true);
    });
  });

  describe('email verification and update flows', () => {
    it('markEmailVerified clears the verification code', async () => {
      const { users } = await getRepos();
      const created = await createUser();
      expect(created.emailVerificationCode).not.toBe('');

      const verified = await users.markEmailVerified(created.id);
      expect(verified.emailVerificationCode).toBe('');
    });

    it('resendEmailVerification issues a fresh short numeric code and stamps the send time', async () => {
      const { users } = await getRepos();
      const created = await createUser({ emailVerificationCode: '' });

      const resent = await users.resendEmailVerification(created.id);
      expect(resent.emailVerificationCode).toMatch(/^\d{6}$/);
      expect(resent.emailVerificationAttempts).toBe(0);
      expect(resent.emailVerificationCodeLastSentAt.getTime()).toBeGreaterThan(0);
      expect(resent.emailVerificationExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it('records failed verification attempts and resets the counter on resend', async () => {
      const { users } = await getRepos();
      const created = await createUser();

      expect(await users.recordEmailVerificationAttempt(created.id)).toBe(1);
      expect(await users.recordEmailVerificationAttempt(created.id)).toBe(2);
      expect((await users.findById(created.id))!.emailVerificationAttempts).toBe(2);

      const resent = await users.resendEmailVerification(created.id);
      expect(resent.emailVerificationAttempts).toBe(0);
    });

    it('completes an email update: archives the old email and promotes the new one', async () => {
      const { users } = await getRepos();
      const oldEmail = uniqueEmail();
      const newEmail = uniqueEmail();
      const created = await createUser({ email: oldEmail });

      const begun = await users.beginEmailUpdate(created.id, newEmail);
      expect(begun.newEmail).toBe(newEmail);
      expect(begun.newEmailVerificationCode).not.toBe('');
      expect((await users.findByNewEmailVerificationCode(begun.newEmailVerificationCode))?.id).toBe(created.id);

      const completed = await users.completeEmailUpdate(created.id);
      expect(completed.email).toBe(newEmail);
      expect(completed.oldEmails).toContain(oldEmail);
      expect(completed.newEmail).toBeNull();
      expect(completed.newEmailVerificationCode).toBe('');
    });

    it('cancelEmailUpdate clears the pending change', async () => {
      const { users } = await getRepos();
      const created = await createUser();
      await users.beginEmailUpdate(created.id, uniqueEmail());

      await users.cancelEmailUpdate(created.id);

      const after = await users.findById(created.id);
      expect(after!.newEmail).toBeNull();
      expect(after!.newEmailVerificationCode).toBe('');
    });

    it('rejects completing an email update onto an address already in use (unique-index backstop)', async () => {
      const { users } = await getRepos();
      const takenEmail = uniqueEmail();
      await createUser({ email: takenEmail });
      const mover = await createUser();

      await users.beginEmailUpdate(mover.id, takenEmail);

      await expect(users.completeEmailUpdate(mover.id)).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('account mutations', () => {
    it('linkGoogleAccount stores the google id', async () => {
      const { users } = await getRepos();
      const created = await createUser();

      await users.linkGoogleAccount(created.id, 'google-xyz');

      expect((await users.findById(created.id))?.googleId).toBe('google-xyz');
    });

    it('setAdmin grants and revokes admin', async () => {
      const { users } = await getRepos();
      const created = await createUser();

      expect((await users.setAdmin(created.id, true)).isAdmin).toBe(true);
      expect((await users.setAdmin(created.id, false)).isAdmin).toBe(false);
    });

    it('throws NotFoundError when mutating a missing user', async () => {
      const { users } = await getRepos();
      await expect(users.setPassword(new ObjectId().toString(), 'whatever123')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('updateSettings', () => {
    it('applies a partial patch without touching the password (no pre-save re-hash)', async () => {
      const { users } = await getRepos();
      const { users: usersCollection } = await getCollections();
      const created = await createUser();
      const hashBefore = (await usersCollection.findOne({ _id: new ObjectId(created.id) }))?.password;

      const settings = await users.updateSettings(created.id, { dailyVerseCountGoal: 100 });

      expect(settings.dailyVerseCountGoal).toBe(100);
      expect(settings.locale).toBe('en'); // untouched fields preserved
      const hashAfter = (await usersCollection.findOne({ _id: new ObjectId(created.id) }))?.password;
      expect(hashAfter).toBe(hashBefore);
    });

    it('returns current settings unchanged for an empty patch', async () => {
      const { users } = await getRepos();
      const created = await createUser();

      const settings = await users.updateSettings(created.id, {});
      expect(settings.dailyVerseCountGoal).toBe(created.settings.dailyVerseCountGoal);
    });
  });

  describe('deletion and counting', () => {
    it('deleteById removes the user and reports whether anything was deleted', async () => {
      const { users } = await getRepos();
      const created = await createUser();

      expect(await users.deleteById(created.id)).toBe(true);
      expect(await users.findById(created.id)).toBeNull();
      expect(await users.deleteById(new ObjectId().toString())).toBe(false);
    });

    it('countCreatedBetween counts users in the date range', async () => {
      const { users } = await getRepos();
      await createUser();
      await createUser();

      const from = new Date(Date.now() - 60 * 60 * 1000);
      const to = new Date(Date.now() + 60 * 60 * 1000);
      expect(await users.countCreatedBetween(from, to)).toBe(2);
    });
  });

  describe('listAdminUsers', () => {
    const baseQuery = {
      limit: 10,
      offset: 0,
      sortOn: 'email',
      sortDirection: 1 as const,
      searchText: '',
    };

    it('paginates, reports the total, sorts, and projects out sensitive fields', async () => {
      const { users } = await getRepos();
      const token = `zz${Date.now()}`;
      await createUser({ email: `a_${token}@example.com` });
      await createUser({ email: `b_${token}@example.com` });
      await createUser({ email: `c_${token}@example.com` });

      const page = await users.listAdminUsers({ ...baseQuery, limit: 2, searchText: token });

      expect(page.total).toBe(3);
      expect(page.users).toHaveLength(2);
      expect(page.users[0]!.email).toBe(`a_${token}@example.com`); // ascending sort
      expect(typeof page.users[0]!.id).toBe('string');
      expect(page.users[0]).not.toHaveProperty('password');
      expect(page.users[0]).not.toHaveProperty('emailVerificationCode');
      expect(page.users[0]!.settings).toBeDefined();
    });

    it('escapes regex special characters in the search text (literal match)', async () => {
      await createUser();

      // The literal string "a+b" is not present in any email; if the "+" were
      // treated as a regex quantifier this could match, so a 0 result proves escaping.
      const { users } = await getRepos();
      const page = await users.listAdminUsers({ ...baseQuery, searchText: 'a+b' });
      expect(page.total).toBe(0);
    });
  });
});
