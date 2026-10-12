import * as Notifications from "expo-notifications";
import { appStorage } from "@/src/storage/keys";
import {
  DEFAULT_DAILY_REMINDER_SETTINGS,
  applyDailyReminderSettings,
  getDailyReminderSettings,
  reconcileDailyReminder,
} from "./dailyReminder";

const scheduleNotificationAsync = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelScheduledNotificationAsync =
  Notifications.cancelScheduledNotificationAsync as jest.Mock;
const getPermissionsAsync = Notifications.getPermissionsAsync as jest.Mock;
const getAllScheduledNotificationsAsync =
  Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const requestPermissionsAsync = Notifications.requestPermissionsAsync as jest.Mock;

describe("dailyReminder", () => {
  beforeEach(async () => {
    await appStorage.remove("dailyReminder");
    scheduleNotificationAsync.mockClear();
    cancelScheduledNotificationAsync.mockClear();
    getPermissionsAsync.mockReset().mockResolvedValue({ status: "granted" });
    requestPermissionsAsync.mockReset().mockResolvedValue({ status: "granted" });
    scheduleNotificationAsync.mockResolvedValue("scheduled-id-1");
  });

  it("defaults to disabled with no persisted settings", async () => {
    expect(await getDailyReminderSettings()).toEqual(DEFAULT_DAILY_REMINDER_SETTINGS);
  });

  it("schedules a repeating daily local notification when enabled", async () => {
    const { settings, permissionDenied } = await applyDailyReminderSettings({
      enabled: true,
      hour: 7,
      minute: 30,
    });

    expect(permissionDenied).toBe(false);
    expect(settings).toEqual({
      enabled: true,
      hour: 7,
      minute: 30,
      notificationId: "scheduled-id-1",
      locale: "en",
    });
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const call = scheduleNotificationAsync.mock.calls[0][0];
    expect(call.trigger).toMatchObject({ type: "daily", hour: 7, minute: 30 });
    expect(await getDailyReminderSettings()).toEqual(settings);
  });

  it("requests permission only when enabling, never proactively", async () => {
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    await applyDailyReminderSettings({ enabled: true, hour: 8, minute: 0 });
    // Already-granted permission short-circuits the actual OS prompt.
    expect(getPermissionsAsync).toHaveBeenCalled();
  });

  it("does not schedule and reports permission denied when the OS declines", async () => {
    getPermissionsAsync.mockResolvedValue({ status: "denied" });
    requestPermissionsAsync.mockResolvedValue({ status: "denied" });

    const { settings, permissionDenied } = await applyDailyReminderSettings({
      enabled: true,
      hour: 9,
      minute: 15,
    });

    expect(permissionDenied).toBe(true);
    expect(settings.enabled).toBe(false);
    expect(settings.notificationId).toBeNull();
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("cancels the previously scheduled notification before scheduling a new one", async () => {
    await applyDailyReminderSettings({ enabled: true, hour: 7, minute: 0 });
    scheduleNotificationAsync.mockResolvedValue("scheduled-id-2");

    await applyDailyReminderSettings({ enabled: true, hour: 8, minute: 0 });

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("scheduled-id-1");
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect((await getDailyReminderSettings()).notificationId).toBe("scheduled-id-2");
  });

  it("cancels the scheduled notification and clears its id when disabled", async () => {
    await applyDailyReminderSettings({ enabled: true, hour: 7, minute: 0 });

    const { settings } = await applyDailyReminderSettings({
      enabled: false,
      hour: 7,
      minute: 0,
    });

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("scheduled-id-1");
    expect(settings).toEqual({ enabled: false, hour: 7, minute: 0, notificationId: null });
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it("never leaves more than one notification pending across repeated toggles", async () => {
    await applyDailyReminderSettings({ enabled: true, hour: 6, minute: 0 });
    await applyDailyReminderSettings({ enabled: false, hour: 6, minute: 0 });
    scheduleNotificationAsync.mockResolvedValue("scheduled-id-3");
    await applyDailyReminderSettings({ enabled: true, hour: 6, minute: 0 });

    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect((await getDailyReminderSettings()).notificationId).toBe("scheduled-id-3");
  });

  describe("reconcileDailyReminder", () => {
    const enabled = { enabled: true, hour: 7, minute: 0, notificationId: "id-1", locale: "en" };

    beforeEach(() => {
      getAllScheduledNotificationsAsync.mockReset().mockResolvedValue([{ identifier: "id-1" }]);
    });

    it("leaves a disabled reminder alone", async () => {
      const { settings } = await reconcileDailyReminder("en");
      expect(settings).toEqual(DEFAULT_DAILY_REMINDER_SETTINGS);
      expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("turns the reminder off when notification permission was revoked", async () => {
      await appStorage.set("dailyReminder", enabled);
      getPermissionsAsync.mockResolvedValue({ status: "denied" });

      const result = await reconcileDailyReminder("en");

      expect(result.settings).toMatchObject({ enabled: false, notificationId: null, hour: 7 });
      expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("id-1");
      expect(requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("does nothing when permission, schedule and locale all match", async () => {
      await appStorage.set("dailyReminder", enabled);
      const { settings } = await reconcileDailyReminder("en");
      expect(settings).toEqual(enabled);
      expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("reschedules with translated text when the locale changed", async () => {
      await appStorage.set("dailyReminder", enabled);
      const { settings } = await reconcileDailyReminder("es");
      expect(settings).toMatchObject({
        enabled: true,
        locale: "es",
        notificationId: "scheduled-id-1",
      });
      const content = scheduleNotificationAsync.mock.calls[0][0].content;
      expect(content.title).not.toBe("Time to read");
    });

    it("reschedules when the notification is no longer pending", async () => {
      await appStorage.set("dailyReminder", enabled);
      getAllScheduledNotificationsAsync.mockResolvedValue([]);
      await reconcileDailyReminder("en");
      expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    });
  });
});
