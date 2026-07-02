import { Collection, Document } from 'mongodb';
import useCollections, { closeConnection } from '../mongo/useCollections';

// Main — intentionally left uninvoked; uncomment the `main()` call at the bottom to run.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const main = async (): Promise<void> => {
  const {
    dailyReminders,
    logEntries,
    passageNotes,
    passageNoteTags,
    users,
  } = await useCollections();

  // delete all documents with an owner that is not in the active user list
  const ownedEntities: { name: string; collection: Collection<Document> }[] = [
    { name: 'dailyreminders', collection: dailyReminders as unknown as Collection<Document> },
    { name: 'logentries', collection: logEntries as unknown as Collection<Document> },
    { name: 'passagenotes', collection: passageNotes as unknown as Collection<Document> },
    { name: 'passagenotetags', collection: passageNoteTags as unknown as Collection<Document> },
  ];

  const activeUserIds = await users.distinct('_id');
  for (const { name, collection } of ownedEntities) {
    const result = await collection.deleteMany({ owner: { $nin: activeUserIds } });
    console.log(`Deleted ${result.deletedCount} documents from ${name}`);
  }

  // close connection
  await closeConnection();
};

console.log('This is a destructive operation that will permanently delete data.');
console.log('You must uncomment the script manually to enable this script.');
// main();
