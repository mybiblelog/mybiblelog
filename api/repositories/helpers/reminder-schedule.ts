export interface ReminderSchedule {
  hour: number;
  minute: number;
  timezoneOffset: number;
}

/**
 * Returns a Date() representing the next occurrence of a daily reminder.
 * This code is meant to run in the UTC timezone.
 * When testing this code in a local timezone, the offset is not needed.
 */
export const getNextOccurrence = ({ hour, minute, timezoneOffset }: ReminderSchedule): Date => {
  // Use the UTC date minus 2 days to find a guaranteed past occurrence
  // Then add 24 hours as needed until the time is in the future
  const now = new Date();
  const nextOccurrence = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - 2,
    hour,
    minute + timezoneOffset,
    0,
    0,
  ));
  while (nextOccurrence.getTime() < new Date().getTime()) {
    nextOccurrence.setHours(nextOccurrence.getHours() + 24);
  }
  return nextOccurrence;
};
