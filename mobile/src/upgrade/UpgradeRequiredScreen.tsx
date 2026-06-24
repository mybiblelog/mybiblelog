import { useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import type { AppSupportStatus } from "@/src/api/appSupportApi";
import { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

export default function UpgradeRequiredScreen({
  status,
}: {
  status: Pick<
    AppSupportStatus,
    "storeUrl" | "message" | "minimumSupported" | "current" | "platform"
  >;
}) {
  const t = useT();
  const { colors } = useTheme();

  const storeUrl = typeof status.storeUrl === "string" && status.storeUrl.trim() ? status.storeUrl : null;
  // Always use client-localized copy. The API may include `message`, but it is not localized.
  const message = t("upgrade_required_message");

  const details = useMemo(() => {
    const current = status.current?.version ?? "?";
    const min = status.minimumSupported?.version ?? "?";
    return t("upgrade_required_details", { current, min });
  }, [status.current?.version, status.minimumSupported?.version, t]);

  async function onPressUpdate() {
    if (!storeUrl) return;
    try {
      await Linking.openURL(storeUrl);
    } catch {
      // ignore; user can try again or update manually
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t("upgrade_required_title")}
        </Text>
        <Text style={[styles.message, { color: colors.mutedText }]}>{message}</Text>
        <Text style={[styles.details, { color: colors.placeholder }]}>{details}</Text>

        <Pressable
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            !storeUrl && { opacity: 0.5 },
          ]}
          disabled={!storeUrl}
          onPress={onPressUpdate}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {t("upgrade_required_button")}
          </Text>
        </Pressable>

        {!storeUrl && (
          <Text style={[styles.fallback, { color: colors.mutedText }]}>
            {t("upgrade_required_no_store_url")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 10,
  },
  details: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  fallback: {
    marginTop: 10,
    fontSize: 13,
    opacity: 0.9,
  },
});

