import useRepositories from '../repositories/useRepositories';
import { closeConnection } from '../mongo/useCollections';
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';

// Update this email to the user you want to create entries for
const EMAIL = 'user@example.com';

// You can also update this date if you want to create entries for a different date
const DATE = dayjs().format('YYYY-MM-DD'); // e.g. '2026-01-01'

const main = async (): Promise<void> => {
  const { users, logEntries } = await useRepositories();

  const user = await users.findByEmail(EMAIL);
  if (!user) {
    console.error(`No user found for email: ${EMAIL}`);
    await closeConnection();
    process.exit(1);
  }

  const bookCount = Bible.getBookCount();
  console.log(`Creating ${bookCount} log entries for ${user.email} on ${DATE}...`);

  for (let book = 1; book <= bookCount; book++) {
    const startVerseId = Bible.getFirstBookVerseId(book);
    const endVerseId = Bible.getLastBookVerseId(book);

    try {
      await logEntries.create(user.id, { date: DATE, startVerseId, endVerseId });
      console.log(`  Created entry for book ${book}: ${Bible.getBookName(book)}`);
    }
    catch (err) {
      console.error(`  Failed to create entry for book ${book} (${Bible.getBookName(book)}):`, err);
    }
  }

  console.log('Done.');
  await closeConnection();
};

// Run the script
main().catch(async (err) => {
  console.error('Unexpected error:', err);
  try { await closeConnection(); }
  catch (e) { /* ignore */ }
  process.exit(1);
});
