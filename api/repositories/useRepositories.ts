import useMongooseModels from '../mongoose/useMongooseModels';
import { createDailyReminderRepository } from './daily-reminder.repository';
import { createEmailRepository } from './email.repository';
import { createFeedbackRepository } from './feedback.repository';
import { createLogEntryRepository } from './log-entry.repository';
import { createPassageNoteRepository } from './passage-note.repository';
import { createPassageNoteTagRepository } from './passage-note-tag.repository';
import { createUserRepository } from './user.repository';

/**
 * Async factory returning the repository layer. This is the only seam route
 * handlers should use for data access; Mongoose stays an implementation
 * detail behind it. Mirrors the useMongooseModels() call pattern (the
 * underlying mongoose.connect is idempotent).
 */
const useRepositories = async () => {
  const models = await useMongooseModels();
  return {
    users: createUserRepository(models),
    logEntries: createLogEntryRepository(models),
    passageNotes: createPassageNoteRepository(models),
    passageNoteTags: createPassageNoteTagRepository(models),
    dailyReminders: createDailyReminderRepository(models),
    feedback: createFeedbackRepository(models),
    emails: createEmailRepository(models),
  };
};

export type Repositories = Awaited<ReturnType<typeof useRepositories>>;

export default useRepositories;
