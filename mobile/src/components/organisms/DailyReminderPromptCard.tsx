import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useT } from "@/src/i18n/LocaleProvider";
import { getDailyReminderSettings } from "@/src/notifications/dailyReminder";
import {
  dismissDailyReminderPrompt,
  isDailyReminderPromptDismissed,
} from "@/src/notifications/dailyReminderPrompt";
import { InlineAlert } from "../molecules/InlineAlert";

/**
 * One-time introduction to the daily reading reminder, shown on Today once the
 * reader has logged something but hasn't turned the reminder on. Dismissal is
 * permanent. State is re-read on focus so coming back from Settings with the
 * reminder now enabled hides the card.
 */
export function DailyReminderPromptCard({ hasEntries }: { hasEntries: boolean }) {
  const t = useT();
  // null until loaded, so the card never flashes in before we know.
  const [show, setShow] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const [reminder, dismissed] = await Promise.all([
          getDailyReminderSettings().catch(() => null),
          isDailyReminderPromptDismissed(),
        ]);
        if (!active) return;
        setShow(reminder !== null && !reminder.enabled && !dismissed);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  if (!hasEntries || !show) return null;

  const dismiss = () => {
    setShow(false);
    void dismissDailyReminderPrompt();
  };

  return (
    <InlineAlert
      testID="today.daily-reminder-prompt"
      tone="info"
      icon="notifications-outline"
      iconColor="info"
      title={t("daily_reminder_prompt_title")}
      text={t("daily_reminder_prompt_text")}
      ctaLabel={t("daily_reminder_prompt_cta")}
      onPressCta={() => router.push("/settings/reading")}
      secondaryCtaLabel={t("daily_reminder_prompt_not_now")}
      onPressSecondaryCta={dismiss}
      dismissLabel={t("dismiss")}
      onDismiss={dismiss}
    />
  );
}
