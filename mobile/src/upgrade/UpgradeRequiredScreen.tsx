import { useT } from "@/src/i18n/LocaleProvider";
import { spacing, useTheme } from "@/src/design";
import { Button, Card, Screen, Text } from "@/src/components";
import type { AppSupportStatus } from "@/src/api/appSupportApi";
import { useMemo } from "react";
import { Linking, StyleSheet } from "react-native";

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

  const storeUrl =
    typeof status.storeUrl === "string" && status.storeUrl.trim() ? status.storeUrl : null;
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
    <Screen padded style={styles.screen}>
      <Card variant="surface" elevated style={[styles.card, { borderColor: colors.border }]}>
        <Text variant="title" style={styles.title}>
          {t("upgrade_required_title")}
        </Text>
        <Text variant="body" color="mutedText" style={styles.message}>
          {message}
        </Text>
        <Text variant="caption" color="placeholder" style={styles.details}>
          {details}
        </Text>

        <Button
          label={t("upgrade_required_button")}
          fullWidth
          disabled={!storeUrl}
          onPress={onPressUpdate}
        />

        {!storeUrl && (
          <Text variant="caption" color="mutedText" style={styles.fallback}>
            {t("upgrade_required_no_store_url")}
          </Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: "center" },
  card: { borderWidth: 1 },
  title: { marginBottom: spacing.sm },
  message: { marginBottom: spacing.md },
  details: { marginBottom: spacing.lg },
  fallback: { marginTop: spacing.md },
});
