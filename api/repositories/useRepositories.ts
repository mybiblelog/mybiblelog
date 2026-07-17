import useCollections from '../mongo/useCollections';
import { createDailyReminderRepository } from './daily-reminder.repository';
import { createEmailRepository } from './email.repository';
import { createFeedbackRepository } from './feedback.repository';
import { createLogEntryRepository } from './log-entry.repository';
import { createPassageNoteRepository } from './passage-note.repository';
import { createPassageNoteTagRepository } from './passage-note-tag.repository';
import { createPlanTrackerRepository } from './plan-tracker.repository';
import { createReadingPlanRepository } from './reading-plan.repository';
import { createUserRepository } from './user.repository';

/**
 * Async factory returning the repository layer. This is the only seam route
 * handlers should use for data access; the MongoDB driver stays an
 * implementation detail behind it. Mirrors the useCollections() call pattern
 * (the underlying connect is idempotent).
 */
const useRepositories = async () => {
  const collections = await useCollections();
  return {
    users: createUserRepository(collections),
    logEntries: createLogEntryRepository(collections),
    passageNotes: createPassageNoteRepository(collections),
    passageNoteTags: createPassageNoteTagRepository(collections),
    readingPlans: createReadingPlanRepository(collections),
    planTrackers: createPlanTrackerRepository(collections),
    dailyReminders: createDailyReminderRepository(collections),
    feedback: createFeedbackRepository(collections),
    emails: createEmailRepository(collections),
  };
};

export type Repositories = Awaited<ReturnType<typeof useRepositories>>;

export default useRepositories;
