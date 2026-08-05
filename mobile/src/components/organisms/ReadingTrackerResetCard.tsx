import dayjs from "dayjs";
import { useState } from "react";
import { useT } from "@/src/i18n/LocaleProvider";
import { useIsAuthenticated } from "@/src/stores/auth";
import { selectIsBibleComplete, useLogEntriesStore } from "@/src/stores/logEntries";
import { userSettingsActions, useUserSettingsStore } from "@/src/stores/userSettings";
import { useToast } from "@/src/toast/ToastProvider";
import { InlineAlert } from "../molecules/InlineAlert";

/**
 * "You've read the whole Bible — want to start over?" prompt, mirroring web's
 * `ReadingTrackerResetCard.vue`.
 *
 * Moving the tracker start date to today resets progress tracking without
 * deleting anything, so a finished reader can begin a new pass. Only offered
 * once the Bible is complete and nothing has been logged today — the moment
 * where starting fresh is unambiguous.
 */
export function ReadingTrackerResetCard({ hasEntriesToday }: { hasEntriesToday: boolean }) {
  const t = useT();
  const { showToast } = useToast();
  const isAuthenticated = useIsAuthenticated();

  const isBibleComplete = useLogEntriesStore((s) => selectIsBibleComplete(s.state));
  const settingsReady = useUserSettingsStore((s) => s.state.status === "ready");
  const dismissed = useUserSettingsStore((s) => s.readingTrackerResetDelayed);

  const [saving, setSaving] = useState(false);

  if (!settingsReady || !isBibleComplete || hasEntriesToday || dismissed) return null;

  const startFresh = () => {
    void (async () => {
      setSaving(true);
      const today = dayjs().format("YYYY-MM-DD");
      // Same save-with-fallback shape as the reading settings screen: prefer
      // the server, fall back to local so an offline reader isn't blocked.
      const savedToServer = isAuthenticated
        ? await userSettingsActions.updateServerSettings({ lookBackDate: today })
        : false;
      if (!savedToServer) {
        await userSettingsActions.setLocalSettings({ lookBackDate: today });
      }
      setSaving(false);
      // Web shows a modal alert here; a dialog after a button tap is heavy on
      // a phone, and the progress bar visibly resetting is its own feedback.
      showToast({ type: "success", message: t("reading_tracker_reset_success") });
    })();
  };

  return (
    <InlineAlert
      testID="today.reading-tracker-reset"
      tone="info"
      icon="refresh"
      iconColor="info"
      title={t("reading_tracker_reset_header")}
      text={t("reading_tracker_reset_message")}
      ctaLabel={t("reading_tracker_reset_start_fresh")}
      onPressCta={startFresh}
      ctaDisabled={saving}
      secondaryCtaLabel={t("dismiss")}
      onPressSecondaryCta={userSettingsActions.dismissReadingTrackerReset}
    />
  );
}
