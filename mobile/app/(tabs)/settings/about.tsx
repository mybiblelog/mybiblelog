import { Ionicons } from "@expo/vector-icons";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useToast } from "@/src/toast/ToastProvider";
import { PRIVACY_POLICY_URL, TERMS_URL, WEBSITE_BASE_URL } from "@/src/constants/links";

function LinkRow({
  icon,
  label,
  url,
  onError,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  url: string;
  onError: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={styles.linkRow}
      onPress={async () => {
        try {
          await Linking.openURL(url);
        } catch {
          onError();
        }
      }}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
      <Text style={[styles.linkText, { color: colors.text }]}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={colors.mutedText} />
    </Pressable>
  );
}

export default function AboutSettings() {
  const t = useT();
  const { colors } = useTheme();
  const { showToast } = useToast();

  // Prefer the build-time version from app config; fall back to the native
  // application version when available (e.g. on a standalone build).
  const version =
    Constants.expoConfig?.version ?? Application.nativeApplicationVersion ?? "—";
  const buildNumber = Application.nativeBuildVersion;

  const onLinkError = () =>
    showToast({ type: "error", message: t("about_open_link_failed") });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
        {t("about_app_label")}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>
            {t("about_version")}
          </Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {buildNumber ? `${version} (${buildNumber})` : version}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
        {t("about_legal_label")}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
        <LinkRow
          icon="shield-checkmark-outline"
          label={t("about_privacy_policy")}
          url={PRIVACY_POLICY_URL}
          onError={onLinkError}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <LinkRow
          icon="document-text-outline"
          label={t("about_terms")}
          url={TERMS_URL}
          onError={onLinkError}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <LinkRow
          icon="globe-outline"
          label={t("about_website")}
          url={WEBSITE_BASE_URL}
          onError={onLinkError}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 14,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  infoRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  linkRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
  },
});
