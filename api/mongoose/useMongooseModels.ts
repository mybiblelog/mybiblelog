import mongoose from 'mongoose';
import config from '../config';

/**
 * Direct Mongoose model access. The ONLY sanctioned callers are:
 *   1. The repository layer (`api/repositories/*`) — the seam all request-time
 *      and service code uses for data access; Mongoose stays an implementation
 *      detail behind it (see `repositories/useRepositories.ts`).
 *   2. Operational scripts (`api/scripts/*`) — maintenance tooling that performs
 *      bulk/admin work (cross-collection wipes, backup cursors, raw
 *      `collection.updateMany` migrations) that intentionally bypasses the
 *      per-entity repository abstraction.
 *
 * Application code (handlers, services, server bootstrap) must go through
 * `useRepositories()` instead of calling this directly.
 */

import User from './schemas/User';
import Email from './schemas/Email';
import LogEntry from './schemas/LogEntry';
import PassageNote from './schemas/PassageNote';
import PassageNoteTag from './schemas/PassageNoteTag';
import DailyReminder from './schemas/DailyReminder';
import Feedback from './schemas/Feedback';

const useMongooseModels = async () => {
  await mongoose.connect(config.mongo.uri);

  return {
    User,
    Email,
    LogEntry,
    PassageNote,
    PassageNoteTag,
    DailyReminder,
    Feedback,
  };
};

// Allow the connection to be closed for testing and scripts
const closeConnection = async () => {
  await mongoose.disconnect();
};

export default useMongooseModels;
export { closeConnection };
