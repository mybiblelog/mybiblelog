import { useState } from "react";
import { useAuth } from "@/src/stores/auth";
import { useT } from "@/src/i18n/LocaleProvider";
import { spacing, useTheme } from "@/src/design";
import {
  Button,
  Card,
  ConfirmDialog,
  Icon,
  ListItem,
  Screen,
  ScreenHeader,
  Text,
} from "@/src/components";
import { router } from "expo-router";
import { useNetInfo } from "@react-native-community/netinfo";
import { ScrollView, StyleSheet, View } from "react-native";

export default function AccountSettings() {
  const t = useT();
  const { colors } = useTheme();
  const { state: authState, logout } = useAuth();
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
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
    <Screen>
      <ScreenHeader padded back title={t("settings_section_account")} />
      <ScrollView contentContainerStyle={styles.content}>
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
                label={t("account_change_email")}
                testID="settings.change-email"
                variant="secondary"
                size="sm"
                leftIcon="mail-outline"
                fullWidth
                onPress={() => router.push("/settings/change-email")}
                style={styles.authActionButtonSpacing}
              />
              <Button
                label={t("auth_logout")}
                testID="settings.logout"
                variant="destructive"
                size="sm"
                leftIcon="log-out-outline"
                fullWidth
                onPress={() => setLogoutConfirmVisible(true)}
                style={styles.authActionButtonSpacing}
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
              {isOnline === false ? (
                <View style={styles.authOfflineNotice}>
                  <Icon name="cloud-offline-outline" size={16} color="mutedText" />
                  <Text variant="caption" color="mutedText" style={styles.authOfflineNoticeText}>
                    {t("auth_login_requires_connection")}
                  </Text>
                </View>
              ) : (
                <>
                  <Button
                    label={t("auth_login")}
                    testID="settings.login"
                    leftIcon="log-in-outline"
                    fullWidth
                    onPress={() => router.push("/login")}
                    style={styles.authActionButtonSpacing}
                  />
                  {/* Make clear an account can be created here, not only used —
                      a Login-only card implies you must already have one. */}
                  <Button
                    label={t("auth_create_account")}
                    testID="settings.register"
                    variant="secondary"
                    leftIcon="person-add-outline"
                    fullWidth
                    onPress={() => router.push("/register")}
                    style={styles.authActionButtonSpacing}
                  />
                </>
              )}
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
              variant="plain"
              style={{ backgroundColor: colors.surfaceMuted }}
              onPress={() => router.push("/settings/delete-account")}
            />
          </>
        )}

        <ConfirmDialog
          visible={logoutConfirmVisible}
          title={t("auth_logout_confirm_title")}
          message={t("auth_logout_confirm_message")}
          confirmLabel={t("auth_logout")}
          cancelLabel={t("cancel")}
          onConfirm={() => {
            setLogoutConfirmVisible(false);
            void logout();
          }}
          onCancel={() => setLogoutConfirmVisible(false)}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.pageGutter, paddingBottom: spacing.listBottom },
  sectionLabel: { marginTop: spacing.sm, marginBottom: spacing.xs },
  authStatusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  authStatusTextCol: { flex: 1, gap: spacing["2xs"] },
  authActionButtonSpacing: { marginTop: spacing.sm },
  authOfflineNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  authOfflineNoticeText: { flex: 1 },
});
