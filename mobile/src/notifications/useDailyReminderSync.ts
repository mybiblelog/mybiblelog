import { useEffect } from "react";
import { AppState } from "react-native";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { reconcileDailyReminder } from "./dailyReminder";

/**
 * Keeps the scheduled daily reminder in sync with the app: on launch, whenever
 * the app returns to the foreground (e.g. from the OS settings screen after
 * revoking notification permission) and whenever the active locale changes.
 * Must be mounted under `LocaleProvider`.
 */
export function useDailyReminderSync(): void {
  const { locale } = useLocale();

  useEffect(() => {
    const reconcile = () => {
      reconcileDailyReminder(locale).catch((err) =>
        console.warn("Failed to reconcile daily reminder", err)
      );
    };
    reconcile();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") reconcile();
    });
    return () => subscription.remove();
  }, [locale]);
}
