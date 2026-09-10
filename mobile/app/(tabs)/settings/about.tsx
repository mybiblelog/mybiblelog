import * as Application from "expo-application";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Fragment } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { spacing, useTheme } from "@/src/design";
import {
  Button,
  Card,
  Icon,
  type IconName,
  ListItem,
  Screen,
  ScreenHeader,
  Text,
} from "@/src/components";
import { useDevToolsButton } from "@/src/dev/devToolsButton";
import { useT } from "@/src/i18n/LocaleProvider";
import { resetOnboardingForTesting } from "@/src/stores/onboarding";
import { useToast } from "@/src/toast/ToastProvider";
import { PRIVACY_POLICY_URL, TERMS_URL, WEBSITE_BASE_URL } from "@/src/constants/links";

export default function AboutSettings() {
  const t = useT();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const devToolsButton = useDevToolsButton();

  // Prefer the build-time version from app config; fall back to the native
  // application version when available (e.g. on a standalone build).
  const version = Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? "—";
  const buildNumber = Application.nativeBuildVersion;

  const onLinkError = () => showToast({ type: "error", message: t("about_open_link_failed") });

  async function openUrl(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      onLinkError();
    }
  }

  const links: { icon: IconName; label: string; url: string }[] = [
    { icon: "shield-checkmark-outline", label: t("about_privacy_policy"), url: PRIVACY_POLICY_URL },
    { icon: "document-text-outline", label: t("about_terms"), url: TERMS_URL },
    { icon: "globe-outline", label: t("about_website"), url: WEBSITE_BASE_URL },
  ];

  return (
    <Screen>
      <ScreenHeader padded back title={t("settings_section_about")} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="label" color="mutedText" style={styles.sectionLabel}>
          {t("about_app_label")}
        </Text>
        <Card>
          <View style={styles.infoRow}>
            <Text variant="bodyStrong" color="mutedText">
              {t("about_version")}
            </Text>
            <Text variant="bodyStrong">
              {buildNumber ? `${version} (${buildNumber})` : version}
            </Text>
          </View>
        </Card>

        <Text variant="label" color="mutedText" style={styles.sectionLabel}>
          {t("about_legal_label")}
        </Text>
        <Card padding="none">
          {links.map((link, i) => (
            <Fragment key={link.url}>
              {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
              <ListItem
                title={link.label}
                leadingIcon={link.icon}
                trailing={<Icon name="open-outline" size={16} color="mutedText" />}
                variant="plain"
                onPress={() => void openUrl(link.url)}
              />
            </Fragment>
          ))}
        </Card>

        {__DEV__ ? (
          <View style={styles.devActions}>
            <Button
              label={t("settings_reset_onboarding")}
              variant="secondary"
              size="sm"
              onPress={() => {
                void resetOnboardingForTesting().then(() => router.replace("/onboarding"));
              }}
            />
            {/* Screenshot aid: the floating dev tools button overlays every
                screen, so hiding it is the only way to capture a clean one. */}
            <Button
              label={
                devToolsButton.visible
                  ? t("settings_hide_dev_tools_button")
                  : t("settings_show_dev_tools_button")
              }
              variant="secondary"
              size="sm"
              testID="about.devToolsButtonToggle"
              onPress={() => {
                if (!devToolsButton.supported) {
                  showToast({ type: "error", message: t("settings_dev_tools_button_unsupported") });
                  return;
                }
                devToolsButton.toggle();
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.pageGutter, paddingBottom: spacing.listBottom },
  sectionLabel: { marginTop: spacing.sm, marginBottom: spacing.xs },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.xl + spacing.md },
  devActions: { marginTop: spacing.lg, alignItems: "flex-start", gap: spacing.sm },
});
