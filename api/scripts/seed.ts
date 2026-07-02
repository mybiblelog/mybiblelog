import useCollections, { closeConnection } from '../mongo/useCollections';
import useRepositories from '../repositories/useRepositories';

// Main — intentionally left uninvoked; uncomment the `main()` call at the bottom to run.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const main = async (): Promise<void> => {
  const {
    dailyReminders,
    emails,
    logEntries,
    passageNotes,
    passageNoteTags,
    users,
    feedback,
  } = await useCollections();

  // Delete all documents. Wholesale collection wipes have no repository
  // equivalent, so this is sanctioned direct collection access for admin scripts.
  await dailyReminders.deleteMany({});
  await emails.deleteMany({});
  await logEntries.deleteMany({});
  await passageNotes.deleteMany({});
  await passageNoteTags.deleteMany({});
  await users.deleteMany({});
  await feedback.deleteMany({});

  // Seed users through the repository, which handles password hashing, settings
  // defaults, and email-verification bookkeeping. An empty verification code
  // marks the account as already verified.
  const { users: usersRepo } = await useRepositories();

  await usersRepo.create({
    email: 'admin@example.com',
    password: 'password',
    isAdmin: true,
    locale: 'en',
    emailVerificationCode: '',
  });

  await usersRepo.create({
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
