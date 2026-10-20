import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { DAILY_REMINDER_NOTIFICATION_DATA_TYPE } from "./dailyReminder";

function isDailyReminderResponse(response: Notifications.NotificationResponse): boolean {
  return response.notification.request.content.data?.type === DAILY_REMINDER_NOTIFICATION_DATA_TYPE;
}

/**
 * Tapping the daily reading reminder notification while the app is running
 * opens Today. Must be mounted under the root `<Stack>`'s parent (not in
 * `RootLayout` itself): a navigation fired before that Stack mounts lands on
 * expo-router's internal root slot and remounts the whole root layout.
 *
 * A tap that cold-starts the app needs no navigation — the root stack already
 * opens on `(tabs)` → Today — so `getLastNotificationResponseAsync` is
 * deliberately not consulted (doing so from `RootLayout` remounted it in a loop,
 * freezing the app on the splash screen).
 */
export function useDailyReminderTapRouting(onboardingCompleted: boolean): void {
  useEffect(() => {
    // `(tabs)` is a protected route until onboarding completes.
    if (!onboardingCompleted) return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (isDailyReminderResponse(response)) {
        router.replace("/(tabs)");
      }
    });
    return () => subscription.remove();
  }, [onboardingCompleted]);
}
