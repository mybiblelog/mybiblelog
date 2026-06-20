/* eslint-disable no-console */

import useMongooseModels, { closeConnection } from '../mongoose/useMongooseModels';
import useRepositories from '../repositories/useRepositories';

// Main
const main = async (): Promise<void> => {
  const {
    DailyReminder,
    Email,
    LogEntry,
    PassageNote,
    PassageNoteTag,
    User,
    // UserSettings, // Embedded in "User",
    Feedback,
  } = await useMongooseModels();

  // Delete all documents. Wholesale collection wipes have no repository
  // equivalent, so this is sanctioned direct model access for admin scripts.
  await DailyReminder.deleteMany({});
  await Email.deleteMany({});
  await LogEntry.deleteMany({});
  await PassageNote.deleteMany({});
  await PassageNoteTag.deleteMany({});
  await User.deleteMany({});
  await Feedback.deleteMany({});

  // Seed users through the repository, which handles password hashing, settings
  // defaults, and email-verification bookkeeping. An empty verification code
  // marks the account as already verified.
  const { users } = await useRepositories();

  await users.create({
    email: 'admin@example.com',
    password: 'password',
    isAdmin: true,
    locale: 'en',
    emailVerificationCode: '',
  });

  await users.create({
    email: 'user@example.com',
    password: 'password',
    locale: 'en',
    emailVerificationCode: '',
  });

  // close connection
  await closeConnection();
};

console.log('This is a destructive operation that will permanently delete data.');
console.log('You must uncomment the script manually to enable this script.');
// main();
