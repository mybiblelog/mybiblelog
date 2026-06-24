import { Stack } from "expo-router";
import { LocaleProvider, useT } from "@/src/i18n/LocaleProvider";
import { ThemeProvider, useTheme } from "@/src/theme/ThemeProvider";
import { AuthProvider } from "@/src/auth/AuthProvider";
import { LogEntriesProvider } from "@/src/log-entries/LogEntriesProvider";
import { UserSettingsProvider } from "@/src/settings/UserSettingsProvider";
import { ToastProvider } from "@/src/toast/ToastProvider";
import { UpgradeGate } from "@/src/upgrade/UpgradeGate";
import { configureGoogleSignIn } from "@/src/auth/googleSignIn";

// Configure native Google Sign-In once, before any login attempt.
configureGoogleSignIn();

export default function RootLayout() {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <UserSettingsProvider>
              <LogEntriesProvider>
                <UpgradeGate>
                  <RootStack />
                </UpgradeGate>
              </LogEntriesProvider>
            </UserSettingsProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}

function RootStack() {
  const t = useT();
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="upgrade-required" />
      <Stack.Screen
        name="login"
        options={{
          headerShown: true,
          title: t("login_title"),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
