import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { i18n } from "@/src/i18n";
import { appStorage } from "@/src/storage/keys";

/**
 * Local, on-device daily reading reminder. This is intentionally independent
 * of the server-side "daily reminder email" feature (`api/services/reminder.service.ts`,
 * `web/app/pages/settings/reminder.vue`): it never calls
 * `/api/reminders/daily-reminder` and stores nothing server-side. It only
 * schedules a repeating local notification via `expo-notifications` and
 * persists the user's choice on-device through the typed storage registry
 * (`src/storage/keys.ts`).
 */
export interface DailyReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  /**
   * The identifier of the currently scheduled local notification, or `null`
   * when nothing is scheduled. Tracked here (rather than re-derived) so
   * exactly one notification is ever pending for this reminder — every
   * schedule call cancels this identifier first.
   */
  notificationId: string | null;
  /**
   * The locale the scheduled notification's text was rendered in. Notification
   * copy is fixed at schedule time, so a differing active locale means the
   * notification must be rescheduled. Absent before any schedule / in data
   * saved before this field existed.
   */
  locale?: string;
}

export const DEFAULT_DAILY_REMINDER_SETTINGS: DailyReminderSettings = {
  enabled: false,
  hour: 8,
  minute: 0,
  notificationId: null,
};

/** Android requires a notification channel before a scheduled notification can show. */
const ANDROID_CHANNEL_ID = "daily-reading-reminder";

/**
 * Notification `data.type` used to route a tap to the Today screen. The
 * notification copy is rendered with the module-scope `i18n` (rather than
 * `useT()`) since scheduling happens outside of React; callers pass the active
 * locale explicitly, as `useT()` does.
 */
export const DAILY_REMINDER_NOTIFICATION_DATA_TYPE = "daily-reading-reminder";

export async function getDailyReminderSettings(): Promise<DailyReminderSettings> {
  const stored = await appStorage.get("dailyReminder");
  return stored ?? DEFAULT_DAILY_REMINDER_SETTINGS;
}

async function ensureAndroidChannelAsync(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Daily Reading Reminder",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Sets how a notification behaves while the app is in the foreground. */
export function configureDailyReminderHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Checks current permission status without prompting. */
export async function hasNotificationPermissionAsync(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * Requests OS notification permission. Only call this at the point the user
 * first enables the reminder — never on app launch.
 */
export async function requestNotificationPermissionAsync(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

async function cancelIfScheduled(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Reconciles the reminder with the requested `{ enabled, hour, minute }`:
 * cancels any previously scheduled notification, and — when enabling —
 * requests permission (if not already granted) and schedules a fresh
 * repeating notification. Returns the settings actually persisted (which
 * reflect `enabled: false` if permission was denied) plus whether permission
 * was denied, so the caller can surface that in the UI instead of leaving the
 * toggle in an on-but-not-scheduled state.
 */
export async function applyDailyReminderSettings(next: {
  enabled: boolean;
  hour: number;
  minute: number;
  /** Locale for the notification text; defaults to the ambient i18n locale. */
  locale?: string;
}): Promise<{ settings: DailyReminderSettings; permissionDenied: boolean }> {
  const current = await getDailyReminderSettings();
  await cancelIfScheduled(current.notificationId);

  if (!next.enabled) {
    const settings: DailyReminderSettings = {
      enabled: false,
      hour: next.hour,
      minute: next.minute,
      notificationId: null,
    };
    await appStorage.set("dailyReminder", settings);
    return { settings, permissionDenied: false };
  }

  const granted = await requestNotificationPermissionAsync();
  if (!granted) {
    const settings: DailyReminderSettings = {
      enabled: false,
      hour: next.hour,
      minute: next.minute,
      notificationId: null,
    };
    await appStorage.set("dailyReminder", settings);
    return { settings, permissionDenied: true };
  }

  const locale = next.locale ?? i18n.locale;
  await ensureAndroidChannelAsync();
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("daily_reading_reminder_notification_title", { locale }),
      body: i18n.t("daily_reading_reminder_notification_body", { locale }),
      data: { type: DAILY_REMINDER_NOTIFICATION_DATA_TYPE },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: next.hour,
      minute: next.minute,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });

  const settings: DailyReminderSettings = {
    enabled: true,
    hour: next.hour,
    minute: next.minute,
    notificationId,
    locale,
  };
  await appStorage.set("dailyReminder", settings);
  return { settings, permissionDenied: false };
}

/**
 * Brings the persisted reminder back in line with reality, without ever
 * prompting. When enabled it (1) switches the reminder off if the OS
 * notification permission has since been revoked, and (2) reschedules if the
 * active `locale` differs from the one the notification text was rendered in
 * or the notification is no longer pending. Returns the settings now in
 * effect plus whether the reminder was just turned off for lack of permission.
 */
export async function reconcileDailyReminder(
  locale: string
): Promise<{ settings: DailyReminderSettings; permissionDenied: boolean }> {
  const current = await getDailyReminderSettings();
  if (!current.enabled) return { settings: current, permissionDenied: false };

  if (!(await hasNotificationPermissionAsync())) {
    return applyDailyReminderSettings({ ...current, enabled: false });
  }

  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const stillScheduled = pending.some((n) => n.identifier === current.notificationId);
  if (stillScheduled && current.locale === locale) {
    return { settings: current, permissionDenied: false };
  }
  return applyDailyReminderSettings({ ...current, locale });
}
