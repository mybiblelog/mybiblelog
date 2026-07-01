/* eslint-disable no-console */

// This is an evergreen migration script, meant to update MongoDB data to the latest schema.

import dayjs from 'dayjs';
import { Collection, Document } from 'mongodb';
import useCollections, { closeConnection } from '../mongo/useCollections';

// Main
const main = async (): Promise<void> => {
  const collections = await useCollections();
  // The migration touches legacy/non-conforming documents, so it works against
  // the untyped collection shape rather than the current document interfaces.
  const users = collections.users as unknown as Collection<Document>;
  const dailyReminders = collections.dailyReminders as unknown as Collection<Document>;
  const feedback = collections.feedback as unknown as Collection<Document>;

  // users without a locale need 'en' locale (original default)
  const usersWithoutLocale = await users.find({ 'settings.locale': { $exists: false } }).toArray();
  for (const user of usersWithoutLocale) {
    console.log(`Migrating user ${user.email} to 'en' locale...`);
    await users.updateOne({ _id: user._id }, { $set: { 'settings.locale': 'en' } });
  }

  // users without a preferred Bible version need 'NASB2020' (original default)
  const usersWithoutPreferredBibleVersion = await users.find({ 'settings.preferredBibleVersion': { $exists: false } }).toArray();
  for (const user of usersWithoutPreferredBibleVersion) {
    console.log(`Migrating user ${user.email} to 'NASB2020' preferred Bible version...`);
    await users.updateOne({ _id: user._id }, { $set: { 'settings.preferredBibleVersion': 'NASB2020' } });
  }

  // users without a start page need 'today' start page (original behavior)
  const usersWithoutStartPage = await users.find({ 'settings.startPage': { $exists: false } }).toArray();
  for (const user of usersWithoutStartPage) {
    console.log(`Migrating user ${user.email} to 'today' start page...`);
    await users.updateOne({ _id: user._id }, { $set: { 'settings.startPage': 'today' } });
  }

  // users with invalid lookBackDate need to have the format fixed
  const usersWithInvalidLookBackDate = await users.find({ 'settings.lookBackDate': { $not: /^\d\d\d\d-\d\d-\d\d$/ } }).toArray();
  for (const user of usersWithInvalidLookBackDate) {
    console.log(`Migrating user ${user.email} to valid lookBackDate format...`);
    const justDate = (user.settings?.lookBackDate ?? '').split('T')[0];
    const fixed = justDate && dayjs(justDate, 'YYYY-MM-DD', true).isValid() ? justDate : dayjs().format('YYYY-MM-DD');
    await users.updateOne({ _id: user._id }, { $set: { 'settings.lookBackDate': fixed } });
  }

  // users with null verification codes or expiration dates need to use empty strings and dates in the past
  const usersWithNullVerificationCodesOrExpirationDates = await users.find({ $or: [
    { 'emailVerificationCode': null },
    { 'emailVerificationExpires': null },
    { 'newEmailVerificationCode': null },
    { 'newEmailVerificationExpires': null },
    { 'passwordResetCode': null },
    { 'passwordResetExpires': null },
  ] }).toArray();
  for (const user of usersWithNullVerificationCodesOrExpirationDates) {
    console.log(`User ${user.email} has at least one null verification code or expiration date...`);
    const set: Record<string, string | Date> = {};
    if (user.emailVerificationCode === null) {
      console.log(`  emailVerificationCode is null, setting to empty string...`);
      set.emailVerificationCode = '';
    }
    if (user.emailVerificationExpires === null) {
      console.log(`  emailVerificationExpires is null, setting to date in the past...`);
      set.emailVerificationExpires = new Date(0);
    }
    if (user.newEmailVerificationCode === null) {
      console.log(`  newEmailVerificationCode is null, setting to empty string...`);
      set.newEmailVerificationCode = '';
    }
    if (user.newEmailVerificationExpires === null) {
      console.log(`  newEmailVerificationExpires is null, setting to date in the past...`);
      set.newEmailVerificationExpires = new Date(0);
    }
    if (user.passwordResetCode === null) {
      console.log(`  passwordResetCode is null, setting to empty string...`);
      set.passwordResetCode = '';
    }
    if (user.passwordResetExpires === null) {
      console.log(`  passwordResetExpires is null, setting to date in the past...`);
      set.passwordResetExpires = new Date(0);
    }
    await users.updateOne({ _id: user._id }, { $set: set });
  }

  // DailyReminder: rename legacy field unsubscribeCode -> publicToken (run this migration before deploying API code that only queries publicToken)
  const remindersWithLegacyField = await dailyReminders.countDocuments({ unsubscribeCode: { $exists: true } });
  if (remindersWithLegacyField === 0) {
    console.log('DailyReminder unsubscribeCode -> publicToken: already migrated (no legacy field).');
  }
  else {
    console.log(`DailyReminder: renaming unsubscribeCode to publicToken on ${remindersWithLegacyField} document(s)...`);
    const result = await dailyReminders.updateMany(
      {},
      { $rename: { unsubscribeCode: 'publicToken' } },
    );
    console.log(`DailyReminder rename complete (matched ${result.matchedCount}, modified ${result.modifiedCount}).`);
  }

  // Feedback: submissions without resolved/archived need both set to false (original default)
  const feedbackWithoutResolvedOrArchived = await feedback.find({
    $or: [{ resolved: { $exists: false } }, { archived: { $exists: false } }],
  }).toArray();
  for (const item of feedbackWithoutResolvedOrArchived) {
    console.log(`Migrating feedback ${item._id} to resolved: false, archived: false...`);
    const set: Record<string, boolean> = {};
    if (item.resolved === undefined) { set.resolved = false; }
    if (item.archived === undefined) { set.archived = false; }
    await feedback.updateOne({ _id: item._id }, { $set: set });
  }

  // close connection
  await closeConnection();
};

console.log('This operation will modify data.');
console.log('You must uncomment the script manually to enable this script.');
// main();
