import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LocaleProvider, useT } from "@/src/i18n/LocaleProvider";
import { ThemeProvider, useTheme } from "@/src/design";
import { modalTransition, stackTransition } from "@/src/design";
import { AuthProvider } from "@/src/auth/AuthProvider";
import { LogEntriesProvider } from "@/src/log-entries/LogEntriesProvider";
import { UserSettingsProvider } from "@/src/settings/UserSettingsProvider";
import { ToastProvider } from "@/src/toast/ToastProvider";
import { UpgradeGate } from "@/src/upgrade/UpgradeGate";
import { configureGoogleSignIn } from "@/src/auth/googleSignIn";
import { Sentry, initCrashReporting } from "@/src/observability/sentry";

// Initialize crash reporting as early as possible (no-op unless a DSN is set).
initCrashReporting();

// Configure native Google Sign-In once, before any login attempt.
configureGoogleSignIn();

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}

// `Sentry.wrap` enables error-boundary capture and touch/navigation context.
// It returns the component unchanged when Sentry isn't initialized.
export default Sentry.wrap(RootLayout);

function RootStack() {
  const t = useT();
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false, ...stackTransition }}>
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
          ...modalTransition,
        }}
      />
    </Stack>
  );
}
