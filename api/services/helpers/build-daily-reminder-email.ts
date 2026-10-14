import { LocaleCode } from '@mybiblelog/shared';
import { DailyReminderRecord, LogEntryRecord, UserRecord } from '../../repositories/helpers/types';
import renderDailyReminderEmail from '../email/email-templates/daily-reminder';

export type DecoratedLogEntry = LogEntryRecord & { displayDate: string; passage: string };

export interface BuildDailyReminderEmailConfig {
  siteUrl: string;
  emailSendingDomain: string;
  emailUnsubscribeAddress: string;
}

const getLocaleBaseUrl = (siteUrl: string, locale: string): string => {
  const localePathSegment = locale === 'en' ? '' : '/' + locale;
  return siteUrl + localePathSegment;
};

const buildDailyReminderTrackedLink = (
  siteUrl: string,
  { publicToken, to }: { publicToken: string; to: string },
): string => {
  const trackUrl = new URL(`/api/reminders/daily-reminder/track/${publicToken}`, siteUrl);
  trackUrl.searchParams.set('to', to);
  return trackUrl.toString();
};

/**
 * Builds the outgoing daily-reminder email (subject/html/headers) for a user.
 * Extracted from `reminder.service.ts` as a pure function so its date-boundary
 * and unsubscribe-header branches can be unit tested without a running service.
 */
export const buildDailyReminderEmail = (
  user: UserRecord,
  reminder: DailyReminderRecord,
  recentLogEntries: DecoratedLogEntry[],
  config: BuildDailyReminderEmailConfig,
) => {
  const { siteUrl, emailSendingDomain, emailUnsubscribeAddress } = config;
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

  const rawSiteLink = `${getLocaleBaseUrl(siteUrl, locale)}/start`;
  const rawSettingsLink = `${getLocaleBaseUrl(siteUrl, locale)}/settings/reminder`;
  const siteLink = buildDailyReminderTrackedLink(siteUrl, { publicToken: reminder.publicToken, to: rawSiteLink });
  const settingsLink = buildDailyReminderTrackedLink(siteUrl, { publicToken: reminder.publicToken, to: rawSettingsLink });
  const unsubscribeLink = `${getLocaleBaseUrl(siteUrl, locale)}/daily-reminder-unsubscribe?code=${reminder.publicToken}`;

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
