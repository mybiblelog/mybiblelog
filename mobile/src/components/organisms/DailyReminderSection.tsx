import { useEffect, useState } from "react";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Platform, StyleSheet, View } from "react-native";
import { spacing } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import {
  DEFAULT_DAILY_REMINDER_SETTINGS,
  applyDailyReminderSettings,
  reconcileDailyReminder,
  type DailyReminderSettings,
} from "@/src/notifications/dailyReminder";
import { CheckboxRow } from "../molecules/CheckboxRow";
import { SelectRow } from "../molecules/SelectRow";
import { Text } from "../atoms/Text";
import { TimePickerSheet } from "./TimePickerSheet";

const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getTimeFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = timeFormatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });
    timeFormatterCache.set(locale, formatter);
  }
  return formatter;
}

function toDate(hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * Settings section for the local, on-device daily reading reminder
 * (independent of the server-side reminder email — see
 * `src/notifications/dailyReminder.ts`). Owns its own state and applies
 * changes immediately: toggling on requests OS notification permission right
 * away (never at app launch), and picking a new time reschedules the
 * notification immediately rather than waiting on a separate Save.
 */
export function DailyReminderSection() {
  const t = useT();
  const { locale } = useLocale();
  const [settings, setSettings] = useState<DailyReminderSettings | null>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Reconcile on load so a reminder whose OS permission was revoked shows
    // as off (with the explanation) instead of looking active.
    void reconcileDailyReminder(locale).then((loaded) => {
      if (cancelled) return;
      setSettings(loaded.settings);
      setPermissionDenied(loaded.permissionDenied);
    });
    return () => {
      cancelled = true;
    };
    // Load once; locale changes are handled by `useDailyReminderSync`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = settings ?? DEFAULT_DAILY_REMINDER_SETTINGS;
  const timeLabel = getTimeFormatter(locale).format(toDate(current.hour, current.minute));

  function openTimePicker() {
    // Android's picker is an imperative native dialog; mounting the component
    // inside the sheet (as on iOS) would stack the two.
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: toDate(current.hour, current.minute),
        mode: "time",
        is24Hour: !getTimeFormatter(locale).resolvedOptions().hour12,
        onChange: (event, date) => {
          if (event.type === "set" && date) void handleTimeChange(date);
        },
      });
      return;
    }
    setTimePickerOpen(true);
  }

  async function handleToggle() {
    if (busy || settings === null) return;
    setBusy(true);
    setPermissionDenied(false);
    const result = await applyDailyReminderSettings({
      enabled: !settings.enabled,
      hour: settings.hour,
      minute: settings.minute,
      locale,
    });
    setSettings(result.settings);
    setPermissionDenied(result.permissionDenied);
    setBusy(false);
  }

  async function handleTimeChange(date: Date) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    if (settings === null) return;

    // While the reminder is off, just stage the chosen time locally — there is
    // nothing scheduled yet to reschedule, and no permission to request.
    if (!settings.enabled) {
      setSettings({ ...settings, hour, minute });
      return;
    }

    setBusy(true);
    setPermissionDenied(false);
    const result = await applyDailyReminderSettings({ enabled: true, hour, minute, locale });
    setSettings(result.settings);
    setPermissionDenied(result.permissionDenied);
    setBusy(false);
  }

  return (
    <View style={styles.section} testID="settings-reading.reminder-section">
      <Text variant="label" color="mutedText">
        {t("settings_reading_reminder_title")}
      </Text>
      <CheckboxRow
        label={t("settings_reading_reminder_toggle")}
        checked={current.enabled}
        onToggle={() => void handleToggle()}
        disabled={busy || settings === null}
      />
      <SelectRow
        label={t("settings_reading_reminder_time_label")}
        value={timeLabel}
        placeholder={t("settings_select_option")}
        onPress={openTimePicker}
        disabled={busy || settings === null}
        testID="settings-reading.reminder-time-select"
      />
      {permissionDenied && (
        <Text variant="caption" color="destructive">
          {t("settings_reading_reminder_permission_denied")}
        </Text>
      )}
      <TimePickerSheet
        visible={timePickerOpen}
        value={toDate(current.hour, current.minute)}
        onChange={(date) => void handleTimeChange(date)}
        onClose={() => setTimePickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs, marginTop: spacing.md },
});
