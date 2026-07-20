import { getConfig } from '../config';
import { Bible, LocaleCode } from '@mybiblelog/shared';
import useRepositories from '../repositories/useRepositories';
import { DailyReminderRecord, LogEntryRecord, UserRecord } from '../repositories/helpers/types';
import renderDailyReminderEmail from './email/email-templates/daily-reminder';
import { EmailService } from './email/email-service';

const MAX_EMAILS_SINCE_LAST_ENGAGEMENT = 3;

const init = async ({ emailService }: { emailService: EmailService }) => {
  const { siteUrl, emailUnsubscribeAddress, emailSendingDomain } = getConfig();
  const baseUrl = siteUrl;

  const getLocaleBaseUrl = (locale) => {
    const localePathSegment = locale === 'en' ? '' : '/' + locale;
    return baseUrl + localePathSegment;
  };

  const buildDailyReminderTrackedLink = ({ publicToken, to }: { publicToken: string; to: string }) => {
    const trackUrl = new URL(`/api/reminders/daily-reminder/track/${publicToken}`, baseUrl);
    trackUrl.searchParams.set('to', to);
    return trackUrl.toString();
  };

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

  type DecoratedLogEntry = LogEntryRecord & { displayDate: string; passage: string };

  const buildEmail = (user: UserRecord, reminder: DailyReminderRecord, recentLogEntries: DecoratedLogEntry[]) => {
    const locale = user.settings.locale as LocaleCode;

    // Get server timezone offset in milliseconds
    // This allows a localhost server running in a non-UTC timezone to act as if it is
    const serverTimezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

    // Create a date that acts as if the server is in UTC
    // This will make no difference if the server is actually running in UTC
    // This date will be used to format a date string (Feb 29, March 4, April 1, etc.)
    // The important part is the day that will appear when the date is formatted
    //
    // If a 20:00 America/New_York reminder is triggered,
    // this UTC time will be 01:00 the next day, which is exactly the UTC time
    // when the reminder would have triggered if the server were running in UTC
    const utcNow = new Date().valueOf() + serverTimezoneOffset;

    // Get the time of day the reminder triggers in milliseconds
    const reminderTimeMs = ((reminder.hour * 60) + reminder.minute) * 60 * 1000;

    // Get the UTC offset of the reminder/user timezone in milliseconds
    const reminderOffsetMs = reminder.timezoneOffset * 60 * 1000;

    // Calculate the number of milliseconds in a day
    const dayMs = 24 * 60 * 60 * 1000;

    // This is the date that will be used to format the email
    // By default, it is the current UTC date
    const emailDate = new Date(utcNow);

    // If the local trigger time (like 8PM / 20:00) plus the
    // timezoneOffset (like 300 for GMT-5) is greater than 24 hours,
    // the current UTC date needs to be rolled back to yesterday
    // to match the local date (as UTC has passed to tomorrow)
    if (reminderTimeMs + reminderOffsetMs > dayMs) {
      emailDate.setTime(utcNow.valueOf() - dayMs);
    }
    // If the local trigger time (like 7AM / 07:00) plus the
    // timezoneOffset (like -540 for GMT+9) is less than zero,
    // the current UTC date needs to be rolled forward to tomorrow
    // to match the local date (as UTC hasn't caught up with local date yet)
    if (reminderTimeMs + reminderOffsetMs < 0) {
      emailDate.setTime(utcNow.valueOf() + dayMs);
    }

    const rawSiteLink = `${getLocaleBaseUrl(locale)}/start`;
    const rawSettingsLink = `${getLocaleBaseUrl(locale)}/settings/reminder`;
    const siteLink = buildDailyReminderTrackedLink({ publicToken: reminder.publicToken, to: rawSiteLink });
    const settingsLink = buildDailyReminderTrackedLink({ publicToken: reminder.publicToken, to: rawSettingsLink });
    const unsubscribeLink = `${getLocaleBaseUrl(locale)}/daily-reminder-unsubscribe?code=${reminder.publicToken}`;

    // Build an unsubscribe email address that includes the reminder public token
    // This can be send to a Cloudflare email worker to unsubscribe the user
    let unsubscribeEmail = '';
    if (emailUnsubscribeAddress) {
      const [address, domain] = emailUnsubscribeAddress.split('@');
      unsubscribeEmail = `${address}+${reminder.publicToken}@${domain}`;
    }

    const { subject, html } = renderDailyReminderEmail({
      siteLink,
      settingsLink,
      unsubscribeLink,
      recentLogEntries,
      emailDate,
      locale,
    });

    let listUnsubscribeHeader = '';
    if (unsubscribeEmail) {
      listUnsubscribeHeader = `<mailto:${unsubscribeEmail}>, <${unsubscribeLink}>`;
    }
    else {
      listUnsubscribeHeader = `<${unsubscribeLink}>`;
    }

    return {
      from: `My Bible Log <team@${emailSendingDomain}>`,
      to: user.email,
      headers: {
        // RFC 2369 compliant List-Unsubscribe header
        'List-Unsubscribe': listUnsubscribeHeader,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      subject,
      html,
    };
  };

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
      await sendReminder(reminder);
    }
  };

  // Check for reminders to send every minute. unref() so the interval never
  // holds the process open once the HTTP server has shut down.
  setInterval(triggerReminders, 60 * 1000).unref();
  console.log('Reminder Service Started');

  return {}; // No public API
};

export default init;
