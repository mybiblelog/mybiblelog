import { StyleSheet, View } from "react-native";
import { spacing, useTheme } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { useIsOnline } from "@/src/stores/connectivity";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

/**
 * Subtle "you're offline" strip shown at the top of screens while the device
 * has no connectivity, so users can trust that the offline-first queue has
 * their changes. Renders nothing while online or before the first NetInfo
 * event resolves.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const t = useT();
  const { colors } = useTheme();

  if (isOnline !== false) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors.surfaceAlt }]}
    >
      <Icon name="cloud-offline-outline" size={14} color="mutedText" />
      <Text variant="caption" color="mutedText" style={styles.text}>
        {t("offline_banner")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing.sm,
  },
  text: { flexShrink: 1 },
});
