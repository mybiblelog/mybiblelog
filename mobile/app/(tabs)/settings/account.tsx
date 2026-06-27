import { useAuth } from "@/src/auth/AuthProvider";
import { useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { router } from "expo-router";
import { useNetInfo } from "@react-native-community/netinfo";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AccountSettings() {
  const t = useT();
  const { colors } = useTheme();
  const { state: authState, logout } = useAuth();
  const netInfo = useNetInfo();
  const isOnline =
    netInfo.isInternetReachable === null ? netInfo.isConnected : netInfo.isInternetReachable;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
        {t("settings_connectivity_label")}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoText, { color: colors.text }]}>
            {isOnline === true
              ? t("connectivity_online")
              : isOnline === false
                ? t("connectivity_offline")
                : t("connectivity_unknown")}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
        {t("settings_auth_label")}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
        {authState.status === "loading" ? (
          <View style={styles.authRow}>
            <Text style={[styles.help, { color: colors.mutedText, marginTop: 0 }]}>
              {t("auth_loading")}
            </Text>
          </View>
        ) : authState.status === "authenticated" ? (
          <View style={styles.authRow}>
            <Text style={[styles.authText, { color: colors.text }]}>
              {t("auth_logged_in_as")} {authState.session.user.email}
            </Text>
            <Pressable
              style={[styles.authButton, { backgroundColor: colors.destructive }]}
              onPress={() => void logout()}
            >
              <Text style={[styles.authButtonText, { color: colors.onDestructive }]}>
                {t("auth_logout")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.authRow}>
            <Text style={[styles.authText, { color: colors.mutedText }]}>
              {t("auth_login")}
            </Text>
            <Pressable
              style={[styles.authButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/login")}
            >
              <Text style={[styles.authButtonText, { color: colors.onPrimary }]}>
                {t("auth_login")}
              </Text>
            </Pressable>
          </View>
        )}
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
  authRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  authText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  authButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  authButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  infoRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "800",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  help: {
    marginTop: 10,
    fontSize: 13,
  },
});

