import type express from 'express';

import { initDatabase } from './repositories/useRepositories';
import initReminderService from './services/reminder.service';
import buildApp from './app';
import useEmailService from './services/email/email-service';

// Named closeConnection for scripts/start-single-process.mjs.
export { closeDatabase as closeConnection } from './repositories/useRepositories';

// Runs the full API boot sequence (database connection, indexes, email and
// reminder services) and returns the Express app without binding a port, so
// the app can be served either standalone (server.ts) or embedded in the
// single-process launcher alongside the Nuxt server.
export const bootApi = async (): Promise<express.Application> => {
  // Connect and build the indexes/schema the data layer relies on.
  await initDatabase();
  const emailService = await useEmailService();
  await initReminderService({ emailService });
  return buildApp();
};

export default bootApi;
