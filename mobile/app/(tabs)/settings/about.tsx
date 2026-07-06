import * as Application from "expo-application";
import Constants from "expo-constants";
import { Fragment } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { spacing, useTheme } from "@/src/design";
import { Card, Icon, type IconName, ListItem, Screen, Text } from "@/src/components";
import { useT } from "@/src/i18n/LocaleProvider";
import { useToast } from "@/src/toast/ToastProvider";
import { PRIVACY_POLICY_URL, TERMS_URL, WEBSITE_BASE_URL } from "@/src/constants/links";

export default function AboutSettings() {
  const t = useT();
  const { colors } = useTheme();
  const { showToast } = useToast();

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
    <Screen edges={[]}>
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
        <Card padded={false} style={styles.card}>
          {links.map((link, i) => (
            <Fragment key={link.url}>
              {i > 0 ? (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              ) : null}
              <ListItem
                title={link.label}
                leadingIcon={link.icon}
                trailing={<Icon name="open-outline" size={16} color="mutedText" />}
                bordered={false}
                style={styles.row}
                onPress={() => void openUrl(link.url)}
              />
            </Fragment>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenH, paddingBottom: spacing.listBottom },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { overflow: "hidden" },
  row: { backgroundColor: "transparent" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.xxxl + spacing.xl },
});
