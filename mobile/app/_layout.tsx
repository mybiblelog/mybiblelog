import { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AchievementModal, ConfigErrorScreen, JustOpenedModal } from "@/src/components";
import { MISSING_CONFIG } from "@/src/config";
import { LocaleProvider } from "@/src/i18n/LocaleProvider";
import { ThemeProvider, modalTransition, stackTransition, useTheme } from "@/src/design";
import { initStores } from "@/src/stores/init";
import { ToastProvider } from "@/src/toast/ToastProvider";
import { UpgradeGate } from "@/src/upgrade/UpgradeGate";
import { configureGoogleSignIn } from "@/src/auth/googleSignIn";
import { Sentry, initCrashReporting } from "@/src/observability/sentry";

// Initialize crash reporting as early as possible (no-op unless a DSN is set).
initCrashReporting();

// Configure native Google Sign-In once, before any login attempt. Skipped when
// the build is misconfigured — it reads the (absent) client ID at call time, and
// this runs at module scope where a throw would kill the app before
// ConfigErrorScreen could explain why.
if (MISSING_CONFIG.length === 0) {
  configureGoogleSignIn();
}

function RootLayout() {
  // Hydrate the Zustand domain stores (connectivity, auth, log entries,
  // settings) once on mount — idempotent, and kept out of module scope so
  // importing this file (e.g. in tests) has no side effects.
  useEffect(() => {
    if (MISSING_CONFIG.length > 0) return;
    initStores();
  }, []);

  // A build missing required env vars can't reach the API or sign in, so stop
  // here and name the missing vars rather than failing obscurely deeper in.
  if (MISSING_CONFIG.length > 0) {
    return <ConfigErrorScreen missing={MISSING_CONFIG} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocaleProvider>
        <ThemeProvider>
          <ToastProvider>
            <UpgradeGate>
              <RootStack />
              <AchievementModal />
              <JustOpenedModal />
            </UpgradeGate>
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
  const { colors } = useTheme();

  // The auth screens are the one place a native header survives, and only for
  // its back/dismiss chevron: they're vertically centred modals, so there's no
  // top row to host an in-content chevron the way pushed screens have. The
  // title is blanked and the bar painted the page color so the 28px in-content
  // title stays the only heading — see `ScreenHeader`.
  const authOptions = {
    headerShown: true,
    headerTitle: "",
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerShadowVisible: false,
    ...modalTransition,
  } as const;

  return (
    <Stack screenOptions={{ headerShown: false, ...stackTransition }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="upgrade-required" />
      <Stack.Screen name="login" options={authOptions} />
      <Stack.Screen name="register" options={authOptions} />
      <Stack.Screen name="forgot-password" options={authOptions} />
    </Stack>
  );
}
