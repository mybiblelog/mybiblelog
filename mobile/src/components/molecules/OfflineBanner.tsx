import { StyleSheet, View } from "react-native";
import { spacing, useTheme } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { useConnectionStatus } from "@/src/stores/connectivity";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

/**
 * Subtle connection strip shown at the top of screens whenever the app can't
 * sync, so users can trust that the offline-first queue has their changes.
 *
 * It distinguishes "your device has no network" from "our server isn't
 * answering" — telling someone they're offline while every other app works
 * blames the wrong thing. Renders nothing while healthy or before the first
 * connectivity signal resolves.
 */
export function OfflineBanner() {
  const status = useConnectionStatus();
  const t = useT();
  const { colors } = useTheme();

  if (status !== "device-offline" && status !== "server-unreachable") return null;

  const offline = status === "device-offline";

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors.surfaceMuted }]}
    >
      <Icon
        name={offline ? "cloud-offline-outline" : "alert-circle-outline"}
        size={14}
        color="mutedText"
      />
      <Text variant="caption" color="mutedText" style={styles.text}>
        {t(offline ? "offline_banner" : "server_unreachable_banner")}
      </Text>
    </View>
  );
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
