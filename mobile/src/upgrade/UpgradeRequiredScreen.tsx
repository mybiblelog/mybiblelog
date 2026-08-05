import { useT } from "@/src/i18n/LocaleProvider";
import { spacing } from "@/src/design";
import { Button, Card, Screen, Text } from "@/src/components";
import type { AppSupportStatus } from "@/src/api/appSupportApi";
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

  const storeUrl =
    typeof status.storeUrl === "string" && status.storeUrl.trim() ? status.storeUrl : null;
  // Always use client-localized copy. The API may include `message`, but it is not localized.
  const message = t("upgrade_required_message");

  const details = t("upgrade_required_details", {
    current: status.current?.version ?? "?",
    min: status.minimumSupported?.version ?? "?",
  });

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
      <Card>
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
  title: { marginBottom: spacing.xs },
  message: { marginBottom: spacing.sm },
  details: { marginBottom: spacing.sm },
  fallback: { marginTop: spacing.sm },
});
