import { getConfig } from '../config';
import { Bible } from '@mybiblelog/shared';
import useRepositories from '../repositories/useRepositories';
import { DailyReminderRecord, UserRecord } from '../repositories/helpers/types';
import { buildDailyReminderEmail } from './helpers/build-daily-reminder-email';
import { EmailService } from './email/email-service';

const MAX_EMAILS_SINCE_LAST_ENGAGEMENT = 3;

const init = async ({ emailService }: { emailService: EmailService }) => {
  const { siteUrl, emailUnsubscribeAddress, emailSendingDomain } = getConfig();

  const { dailyReminders, users, logEntries } = await useRepositories();

  const getRecentLogEntries = async (user: UserRecord) => {
    const { locale } = user.settings;

    const recentLogEntries = await logEntries.listRecentByOwner(user.id, 10);

    // Add human-readable 'displayDate' and 'passage'
    const dateFormatOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const dateTimeFormat = new Intl.DateTimeFormat(locale, dateFormatOptions);
    return recentLogEntries.map((logEntry) => ({
      ...logEntry,
      displayDate: dateTimeFormat.format(new Date(logEntry.date)),
      passage: Bible.displayVerseRange(logEntry.startVerseId, logEntry.endVerseId, locale),
    }));
  };

  const buildEmail = (user: UserRecord, reminder: DailyReminderRecord, recentLogEntries: Awaited<ReturnType<typeof getRecentLogEntries>>) =>
    buildDailyReminderEmail(user, reminder, recentLogEntries, { siteUrl, emailUnsubscribeAddress, emailSendingDomain });

  const sendReminder = async (reminder: DailyReminderRecord) => {
    // If the user hasn't engaged with the last MAX_EMAILS_SINCE_LAST_ENGAGEMENT
    // reminder emails, disable the reminder instead of sending another one.
    if (reminder.emailsSentSinceLastEngagement >= MAX_EMAILS_SINCE_LAST_ENGAGEMENT) {
      await dailyReminders.deactivate(reminder.id);
      return;
    }

    const user = await users.findById(reminder.ownerId);
    if (!user) {
      return;
    }
    const recentLogEntries = await getRecentLogEntries(user);
    const email = buildEmail(user, reminder, recentLogEntries);

    // Update nextOccurrence and increment emailsSentSinceLastEngagement before
    // sending email to avoid duplicate emails (the repository saves the document).
    await dailyReminders.advanceSchedule(reminder.id);

    // Send email after database is updated
    await emailService.send(email);
  };

  const triggerReminders = async () => {
    // Get server timezone offset in milliseconds
    const serverTimezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

    // Get the current time in UTC
    const utcNow = new Date().valueOf() + serverTimezoneOffset;

    // Find all active reminders whose nextOccurrence has been reached
    const remindersToTrigger = await dailyReminders.findDue(utcNow);

    for (const reminder of remindersToTrigger) {
      try {
        await sendReminder(reminder);
      }
      catch (err) {
        // Don't let a single failed reminder (e.g. an email send failure)
        // abort the rest of the batch.
        console.error(`Failed to send reminder ${reminder.id}:`, err);
        continue;
      }
    }
  };

  // Check for reminders to send every minute. unref() so the interval never
  // holds the process open once the HTTP server has shut down.
  setInterval(() => {
    triggerReminders().catch((err) => {
      console.error('Unhandled error in triggerReminders:', err);
    });
  }, 60 * 1000).unref();
  console.log('Reminder Service Started');

  return {}; // No public API
};

export default init;
