import fs from 'node:fs';
import path from 'node:path';
import { Collection, Document } from 'mongodb';
import useCollections, { closeConnection } from '../mongo/useCollections';

const backupDir = '.mongodb_backup';

// Main
const main = async (): Promise<void> => {
  try {
    // Check if backup directory exists
    if (fs.existsSync(backupDir)) {
      console.error('Backup directory already exists. Delete before proceeding.');
      process.exit(1);
    }

    // Create backup directory
    console.log('Creating backup directory...');
    fs.mkdirSync(backupDir, { recursive: true });

    const collections = await useCollections();

    // Backup file names keep their original (PascalCase) form for continuity.
    const targets: { name: string; collection: Collection<Document> }[] = [
      { name: 'DailyReminder', collection: collections.dailyReminders as unknown as Collection<Document> },
      { name: 'Email', collection: collections.emails as unknown as Collection<Document> },
      { name: 'LogEntry', collection: collections.logEntries as unknown as Collection<Document> },
      { name: 'PassageNote', collection: collections.passageNotes as unknown as Collection<Document> },
      { name: 'PassageNoteTag', collection: collections.passageNoteTags as unknown as Collection<Document> },
      { name: 'User', collection: collections.users as unknown as Collection<Document> },
      // UserSettings is embedded in User.
      { name: 'Feedback', collection: collections.feedback as unknown as Collection<Document> },
    ];

    // Backup each collection
    for (const { name, collection } of targets) {
      console.log(`\nBacking up ${name}...`);
      const modelBackupFile = path.resolve(backupDir, `${name}.json`);

      // Get total count for progress tracking
      const totalCount = await collection.countDocuments({});
      console.log(`  Found ${totalCount} document(s)`);

      if (totalCount === 0) {
        // Create empty file for consistency
        fs.writeFileSync(modelBackupFile, '', 'utf-8');
        console.log(`  ✓ ${name} backup complete (empty collection)`);
        continue;
      }

      // Initialize file
      fs.writeFileSync(modelBackupFile, '', 'utf-8');

      // Stream documents to file
      let documentCount = 0;
      const cursor = collection.find({});
      for await (const doc of cursor) {
        fs.appendFileSync(modelBackupFile, JSON.stringify(doc) + '\n', 'utf-8');
        documentCount++;

        // Log progress every 100 documents or at milestones
        if (documentCount % 100 === 0 || documentCount === totalCount) {
          const percentage = ((documentCount / totalCount) * 100).toFixed(1);
          console.log(`  Progress: ${documentCount}/${totalCount} (${percentage}%)`);
        }
      }
      console.log(`  ✓ ${name} backup complete (${documentCount} documents)`);
    }

    // Close connection
    console.log('\nClosing database connection...');
    await closeConnection();
    console.log('✓ Backup complete.');
  }
  catch (error) {
    console.error('\n✗ Backup failed:', error instanceof Error ? error.message : String(error));

    // Attempt cleanup on error
    try {
      if (fs.existsSync(backupDir)) {
        console.log('Cleaning up backup directory...');
        fs.rmSync(backupDir, { recursive: true, force: true });
      }
    }
    catch (cleanupError) {
      console.error('Warning: Failed to cleanup backup directory:', cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
    }

    // Close connection if still open
    try {
      await closeConnection();
    }
    catch (closeError) {
      // Ignore close errors during error handling
    }

    process.exit(1);
  }
};

main();
