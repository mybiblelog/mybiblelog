const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Admins are notified about new feedback only when the previously most recent
 * submission (if any) is over an hour old. This debounces a burst of
 * submissions — close together in time — down to a single email.
 */
export const shouldNotifyAdminsOfFeedback = (previousMostRecentCreatedAt: Date | null, now: Date): boolean => {
  if (!previousMostRecentCreatedAt) {
    return true;
  }
  return now.getTime() - previousMostRecentCreatedAt.getTime() > ONE_HOUR_MS;
};
