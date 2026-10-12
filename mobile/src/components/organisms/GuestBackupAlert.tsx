import { router } from "expo-router";
import { useT } from "@/src/i18n/LocaleProvider";
import { useIsUnauthenticated } from "@/src/stores/auth";
import { useCanReachServer } from "@/src/stores/connectivity";
import { InlineAlert } from "../molecules/InlineAlert";

/**
 * "Your log is only on this device" warning for signed-out readers.
 *
 * A guest's entries and notes live only in on-device storage, so uninstalling,
 * clearing app data, or replacing the phone loses all of them. Shown once there
 * is something to lose. Dismissal lasts the alert's default window (a week) and
 * then it returns, since the risk hasn't gone away.
 */
export function GuestBackupAlert({ hasEntries }: { hasEntries: boolean }) {
  const t = useT();
  const isUnauthenticated = useIsUnauthenticated();
  const canReachServer = useCanReachServer();

  if (!isUnauthenticated || !hasEntries) return null;

  return (
    <InlineAlert
      testID="today.guest-backup"
      icon="cloud-offline-outline"
      title={t("guest_backup_title")}
      text={t("guest_backup_text")}
      // Both flows need the server; offer them only when it can be reached.
      ctaLabel={canReachServer ? t("auth_create_account") : undefined}
      ctaIcon="person-add-outline"
      onPressCta={canReachServer ? () => router.push("/register") : undefined}
      secondaryCtaLabel={canReachServer ? t("auth_login") : undefined}
      onPressSecondaryCta={canReachServer ? () => router.push("/login") : undefined}
      dismissLabel={t("dismiss")}
      dismissKey="guestBackupWarningDismissed"
    />
  );
}
