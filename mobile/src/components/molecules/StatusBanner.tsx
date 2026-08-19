import { StyleSheet, View } from "react-native";
import { spacing, useTheme } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import type { TranslationKey } from "@/src/i18n";
import { useIsStorageDegraded } from "@/src/storage/health";
import { useIsAuthenticated } from "@/src/stores/auth";
import { useConnectionStatus } from "@/src/stores/connectivity";
import { Icon } from "../atoms/Icon";
import type { IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";

/**
 * Subtle status strip shown at the top of screens whenever the app can't record
 * what the user is doing, so they can trust the offline-first queue has their
 * changes — or find out when it doesn't.
 *
 * It carries two unrelated problems, and shows only the more serious one:
 *
 * - **Storage degraded** — the device refused a read or write, so changes are
 *   being dropped and some data may be missing from the screen. Tinted
 *   `destructive`, because unlike everything else here it is not recoverable by
 *   waiting it out, and the visible symptom (an empty reading log) looks exactly
 *   like data loss.
 * - **Connectivity** — distinguishing "your device has no network" from "our
 *   server isn't answering", since telling someone they're offline while every
 *   other app works blames the wrong thing. Shown only while signed in: both of
 *   those messages promise the changes will sync, and there is nothing to sync
 *   to without a session.
 *
 * Storage wins because "your changes aren't being saved" strictly outranks
 * "your changes will sync later", and stacking two strips buys nothing: the
 * connectivity message is about a queue that can't be written to anyway.
 *
 * Renders nothing while healthy or before the first connectivity signal
 * resolves.
 */
export function StatusBanner() {
  const storageDegraded = useIsStorageDegraded();
  // False while the session is still loading, so the strip stays silent through
  // startup instead of flashing a connectivity message before auth resolves.
  const isAuthenticated = useIsAuthenticated();
  const status = useConnectionStatus();
  const t = useT();
  const { colors } = useTheme();

  const banner = selectBanner(storageDegraded, isAuthenticated, status);
  if (!banner) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors.surfaceMuted }]}
    >
      <Icon name={banner.icon} size={14} color={banner.tone} />
      <Text variant="caption" color={banner.tone} style={styles.text}>
        {t(banner.key)}
      </Text>
    </View>
  );
}

type Banner = { icon: IconName; key: TranslationKey; tone: "mutedText" | "destructive" };

function selectBanner(
  storageDegraded: boolean,
  isAuthenticated: boolean,
  status: ReturnType<typeof useConnectionStatus>
): Banner | null {
  // A device that can't save is a fact regardless of who is signed in.
  if (storageDegraded) {
    return { icon: "alert-circle-outline", key: "storage_degraded_banner", tone: "destructive" };
  }
  if (!isAuthenticated) return null;
  if (status === "device-offline") {
    return { icon: "cloud-offline-outline", key: "offline_banner", tone: "mutedText" };
  }
  if (status === "server-unreachable") {
    return { icon: "alert-circle-outline", key: "server_unreachable_banner", tone: "mutedText" };
  }
  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.pageGutter,
    paddingVertical: spacing.xs,
  },
  text: { flexShrink: 1 },
});
