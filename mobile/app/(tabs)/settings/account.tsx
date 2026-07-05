import { useAuth } from "@/src/stores/auth";
import { useT } from "@/src/i18n/LocaleProvider";
import { spacing, useTheme } from "@/src/design";
import { Button, Card, Icon, ListItem, Text } from "@/src/components";
import { router } from "expo-router";
import { useNetInfo } from "@react-native-community/netinfo";
import { ScrollView, StyleSheet, View } from "react-native";

export default function AccountSettings() {
  const t = useT();
  const { colors } = useTheme();
  const { state: authState, logout } = useAuth();
  const netInfo = useNetInfo();
  const isOnline =
    netInfo.isInternetReachable === null ? netInfo.isConnected : netInfo.isInternetReachable;

  const connectivityText =
    isOnline === true
      ? t("connectivity_online")
      : isOnline === false
        ? t("connectivity_offline")
        : t("connectivity_unknown");

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text variant="label" color="mutedText" style={styles.sectionLabel}>
        {t("settings_connectivity_label")}
      </Text>
      <Card>
        <Text variant="bodyStrong">{connectivityText}</Text>
      </Card>

      <Text variant="label" color="mutedText" style={styles.sectionLabel}>
        {t("settings_auth_label")}
      </Text>
      <Card>
        {authState.status === "loading" ? (
          <Text variant="body" color="mutedText">
            {t("auth_loading")}
          </Text>
        ) : authState.status === "authenticated" ? (
          <>
            <View style={styles.authStatusRow}>
              <Icon name="checkmark-circle-outline" size={22} color="success" />
              <View style={styles.authStatusTextCol}>
                <Text variant="bodyStrong">{t("auth_logged_in_label")}</Text>
                <Text variant="caption" color="mutedText">
                  {t("auth_logged_in_as")} {authState.session.user.email}
                </Text>
              </View>
            </View>
            <Button
              label={t("auth_logout")}
              variant="destructive"
              size="sm"
              onPress={() => void logout()}
              style={styles.authActionButton}
            />
          </>
        ) : (
          <>
            <View style={styles.authStatusRow}>
              <Icon name="alert-circle-outline" size={22} color="destructive" />
              <View style={styles.authStatusTextCol}>
                <Text variant="bodyStrong" color="destructive">
                  {t("auth_not_logged_in")}
                </Text>
                <Text variant="caption" color="mutedText">
                  {t("auth_offline_sync_hint")}
                </Text>
              </View>
            </View>
            <Button
              label={t("auth_login")}
              testID="settings.login"
              leftIcon="log-in-outline"
              fullWidth
              onPress={() => router.push("/login")}
              style={styles.authActionButtonSpacing}
            />
          </>
        )}
      </Card>

      {authState.status === "authenticated" && (
        <>
          <Text variant="label" color="mutedText" style={styles.sectionLabel}>
            {t("account_danger_zone_label")}
          </Text>
          <ListItem
            title={t("account_delete_button")}
            titleColor="destructive"
            bordered={false}
            style={{ backgroundColor: colors.surfaceAlt }}
            onPress={() => router.push("/settings/delete-account")}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.screenH, paddingBottom: spacing.listBottom },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  authStatusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  authStatusTextCol: { flex: 1, gap: spacing.xs },
  authActionButton: { marginTop: spacing.lg, alignSelf: "flex-end" },
  authActionButtonSpacing: { marginTop: spacing.lg },
});
