import type express from 'express';

import { ensureIndexes } from './mongo/useCollections';
import useRepositories from './repositories/useRepositories';
import initReminderService from './services/reminder.service';
import buildApp from './app';
import useEmailService from './services/email/email-service';

export { closeConnection } from './mongo/useCollections';

// Runs the full API boot sequence (database connection, indexes, email and
// reminder services) and returns the Express app without binding a port, so
// the app can be served either standalone (server.ts) or embedded in the
// single-process launcher alongside the Nuxt server.
export const bootApi = async (): Promise<express.Application> => {
  // make sure the database connection is established
  await useRepositories();
  // Build the unique/text indexes the data layer relies on.
  await ensureIndexes();
  const emailService = await useEmailService();
  await initReminderService({ emailService });
  return buildApp();
};

export default bootApi;
