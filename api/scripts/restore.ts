import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { Collection, Document } from 'mongodb';
import useCollections, { closeConnection, ensureIndexes } from '../mongo/useCollections';
import { parseDocument } from './lib/ejson-lines';
import { backupRoot } from './lib/backup-paths';

const BATCH_SIZE = 500;

const resolveBackupDir = (arg: string | undefined): string => {
  if (arg) {
    return path.resolve(arg);
  }
  const newest = fs.existsSync(backupRoot)
    ? fs.readdirSync(backupRoot, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort().pop()
    : undefined;
  if (!newest) {
    throw new Error(`No backups found in ${backupRoot}. Pass a backup directory.`);
  }
  return path.join(backupRoot, newest);
};

const confirm = async (question: string): Promise<boolean> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>(resolve => rl.question(question, resolve));
  rl.close();
  return answer.trim().toLowerCase() === 'yes';
};

const restoreFile = async (file: string, collection: Collection<Document>): Promise<number> => {
  const lines = readline.createInterface({ input: fs.createReadStream(file, 'utf-8'), crlfDelay: Infinity });
  let batch: Document[] = [];
  let restored = 0;
  const flush = async () => {
    if (batch.length) {
      await collection.insertMany(batch);
      restored += batch.length;
      batch = [];
    }
  };
  for await (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const doc = parseDocument(line);
    if (typeof doc._id === 'string') {
      throw new Error(`${path.basename(file)} has a plain-string _id; it looks like a pre-EJSON backup, which lost type information and cannot be restored faithfully.`);
    }
    batch.push(doc);
    if (batch.length >= BATCH_SIZE) {
      await flush();
    }
  }
  await flush();
  return restored;
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const drop = args.includes('--drop');
  const backupDir = resolveBackupDir(args.find(a => !a.startsWith('--')));

  try {
    const collections = await useCollections();
    const targets = Object.values(collections) as unknown as Collection<Document>[];
    for (const { collectionName } of targets) {
      const file = path.join(backupDir, `${collectionName}.json`);
      if (!fs.existsSync(file)) {
        throw new Error(`Missing backup file: ${file}`);
      }
    }

    const dbName = collections.users.dbName;
    console.log(`Restoring ${backupDir}\n  into database "${dbName}"${drop ? ' (existing collections will be DROPPED)' : ''}`);

    if (drop && !(await confirm('Type "yes" to continue: '))) {
      console.log('Aborted.');
      await closeConnection();
      return;
    }

    for (const collection of targets) {
      if (drop) {
        await collection.drop().catch(() => undefined); // missing collection is fine
      }
      else if (await collection.countDocuments({}, { limit: 1 }) > 0) {
        throw new Error(`${collection.collectionName} target collection is not empty. Use --drop to replace it.`);
      }
    }

    for (const collection of targets) {
      const { collectionName } = collection;
      const count = await restoreFile(path.join(backupDir, `${collectionName}.json`), collection);
      console.log(`  ✓ ${collectionName}: ${count} document(s)`);
    }

    await ensureIndexes();
    console.log('✓ Restore complete.');
  }
  catch (error) {
    console.error('\n✗ Restore failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
  finally {
    await closeConnection();
  }
};

main();
