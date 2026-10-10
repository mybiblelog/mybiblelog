import fs from 'node:fs';
import path from 'node:path';
import { once } from 'node:events';
import { Collection, Document } from 'mongodb';
import useCollections, { closeConnection } from '../mongo/useCollections';
import { serializeDocument } from './lib/ejson-lines';
import { backupRoot } from './lib/backup-paths';

// e.g. 2026-10-07T14-30-05 (no colons, so it is safe as a directory name)
const timestamp = new Date().toISOString().replace(/\.\d+Z$/, '').replace(/:/g, '-');
const backupDir = path.join(backupRoot, timestamp);

const main = async (): Promise<void> => {
  try {
    console.log(`Creating backup directory ${backupDir}...`);
    fs.mkdirSync(backupDir, { recursive: true });

    const collections = await useCollections();

    for (const collection of Object.values(collections) as unknown as Collection<Document>[]) {
      const name = collection.collectionName;
      console.log(`\nBacking up ${name}...`);
      const modelBackupFile = path.resolve(backupDir, `${name}.json`);

      const totalCount = await collection.countDocuments({});
      console.log(`  Found ${totalCount} document(s)`);

      // One buffered stream per file instead of a synchronous append per document.
      const stream = fs.createWriteStream(modelBackupFile, { encoding: 'utf-8' });
      let documentCount = 0;
      for await (const doc of collection.find({})) {
        if (!stream.write(serializeDocument(doc) + '\n')) {
          await once(stream, 'drain');
        }
        documentCount++;
        if (documentCount % 100 === 0 || documentCount === totalCount) {
          const percentage = ((documentCount / totalCount) * 100).toFixed(1);
          console.log(`  Progress: ${documentCount}/${totalCount} (${percentage}%)`);
        }
      }
      stream.end();
      await once(stream, 'finish');

      if (documentCount !== totalCount) {
        console.warn(`  ! ${name}: counted ${totalCount} but wrote ${documentCount} (collection changed during backup)`);
      }
      console.log(`  ✓ ${name} backup complete (${documentCount} documents)`);
    }

    console.log('\nClosing database connection...');
    await closeConnection();
    console.log(`✓ Backup complete: ${backupDir}`);
  }
  catch (error) {
    console.error('\n✗ Backup failed:', error instanceof Error ? error.message : String(error));

    try {
      if (fs.existsSync(backupDir)) {
        console.log('Cleaning up backup directory...');
        fs.rmSync(backupDir, { recursive: true, force: true });
      }
    }
    catch (cleanupError) {
      console.error('Warning: Failed to cleanup backup directory:', cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
    }

    try {
      await closeConnection();
    }
    catch {
      // Ignore close errors during error handling
    }

    process.exit(1);
  }
};

main();
