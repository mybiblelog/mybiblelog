/* eslint-disable no-console */

// This is an evergreen migration script, meant to update MongoDB data to the latest schema.

import dayjs from 'dayjs';
import useMongooseModels, { closeConnection } from '../mongoose/useMongooseModels';

// Main
const main = async (): Promise<void> => {
  const { User, DailyReminder } = await useMongooseModels();

  // users without a locale need 'en' locale (original default)
  const usersWithoutLocale = await User.find({ 'settings.locale': { $exists: false } });
  for (const user of usersWithoutLocale) {
    console.log(`Migrating user ${user.email} to 'en' locale...`);
    user.settings.locale = 'en';
    await user.save();
  }

  // users without a preferred Bible version need 'NASB2020' (original default)
  const usersWithoutPreferredBibleVersion = await User.find({ 'settings.preferredBibleVersion': { $exists: false } });
  for (const user of usersWithoutPreferredBibleVersion) {
    console.log(`Migrating user ${user.email} to 'NASB2020' preferred Bible version...`);
    user.settings.preferredBibleVersion = 'NASB2020';
    await user.save();
  }

  // users without a start page need 'today' start page (original behavior)
  const usersWithoutStartPage = await User.find({ 'settings.startPage': { $exists: false } });
  for (const user of usersWithoutStartPage) {
    console.log(`Migrating user ${user.email} to 'today' start page...`);
    user.settings.startPage = 'today';
    await user.save();
  }

  // users with invalid lookBackDate need to have the format fixed
  const usersWithInvalidLookBackDate = await User.find({ 'settings.lookBackDate': { $not: /^\d\d\d\d-\d\d-\d\d$/ } });
  for (const user of usersWithInvalidLookBackDate) {
    console.log(`Migrating user ${user.email} to valid lookBackDate format...`);
    const justDate = user.settings.lookBackDate.split('T')[0];
    if (justDate && dayjs(justDate, 'YYYY-MM-DD', true).isValid()) {
      user.settings.lookBackDate = justDate;
    }
    else {
      user.settings.lookBackDate = dayjs().format('YYYY-MM-DD');
    }
    await user.save();
  }

  // users with null verification codes or expiration dates need to use empty strings and dates in the past
  const usersWithNullVerificationCodesOrExpirationDates = await User.find({ $or: [
    { 'emailVerificationCode': null },
    { 'emailVerificationExpires': null },
    { 'newEmailVerificationCode': null },
    { 'newEmailVerificationExpires': null },
    { 'passwordResetCode': null },
    { 'passwordResetExpires': null },
  ] });
  for (const user of usersWithNullVerificationCodesOrExpirationDates) {
    console.log(`User ${user.email} has at least one null verification code or expiration date...`);
    if (user.emailVerificationCode === null) {
      console.log(`  emailVerificationCode is null, setting to empty string...`);
      user.emailVerificationCode = '';
    }
    if (user.emailVerificationExpires === null) {
      console.log(`  emailVerificationExpires is null, setting to date in the past...`);
      user.emailVerificationExpires = new Date(0);
    }
    if (user.newEmailVerificationCode === null) {
      console.log(`  newEmailVerificationCode is null, setting to empty string...`);
      user.newEmailVerificationCode = '';
    }
    if (user.newEmailVerificationExpires === null) {
      console.log(`  newEmailVerificationExpires is null, setting to date in the past...`);
      user.newEmailVerificationExpires = new Date(0);
    }
    if (user.passwordResetCode === null) {
      console.log(`  passwordResetCode is null, setting to empty string...`);
      user.passwordResetCode = '';
    }
    if (user.passwordResetExpires === null) {
      console.log(`  passwordResetExpires is null, setting to date in the past...`);
      user.passwordResetExpires = new Date(0);
    }
    await user.save();
  }

  // DailyReminder: rename legacy field unsubscribeCode -> publicToken (run this migration before deploying API code that only queries publicToken)
  const remindersWithLegacyField = await DailyReminder.countDocuments({ unsubscribeCode: { $exists: true } });
  if (remindersWithLegacyField === 0) {
    console.log('DailyReminder unsubscribeCode -> publicToken: already migrated (no legacy field).');
  }
  else {
    console.log(`DailyReminder: renaming unsubscribeCode to publicToken on ${remindersWithLegacyField} document(s)...`);
    const result = await DailyReminder.collection.updateMany(
      {},
      { $rename: { unsubscribeCode: 'publicToken' } },
    );
    console.log(`DailyReminder rename complete (matched ${result.matchedCount}, modified ${result.modifiedCount}).`);
  }

  // close connection
  await closeConnection();
};

console.log('This operation will modify data.');
console.log('You must uncomment the script manually to enable this script.');
// main();
