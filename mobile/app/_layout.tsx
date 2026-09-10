import { useEffect } from "react";
import { View, useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AchievementModal, ConfigErrorScreen, JustOpenedModal } from "@/src/components";
import { MISSING_CONFIG } from "@/src/config";
import { LocaleProvider } from "@/src/i18n/LocaleProvider";
import {
  ThemeProvider,
  colorsByScheme,
  fadeTransition,
  modalTransition,
  stackTransition,
  useTheme,
} from "@/src/design";
import { initDevToolsButton } from "@/src/dev/devToolsButton";
import { initStores } from "@/src/stores/init";
import { useOnboardingStatus } from "@/src/stores/onboarding";
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
    // Re-apply the dev tools button preference chosen in Settings → About, so
    // a button hidden for screenshots stays hidden across reloads.
    initDevToolsButton();
  }, []);

  const onboarding = useOnboardingStatus();
  // Read unconditionally (rules of hooks) even though it's only used on the
  // loading-splash branch below.
  const colorScheme = useColorScheme();

  // A build missing required env vars can't reach the API or sign in, so stop
  // here and name the missing vars rather than failing obscurely deeper in.
  if (MISSING_CONFIG.length > 0) {
    return <ConfigErrorScreen missing={MISSING_CONFIG} />;
  }

  // Which root screen is reachable — the onboarding wizard or the tab stack —
  // depends on a local AsyncStorage read, so it isn't known on the very first
  // render. This resolves in well under a frame (no network dependency); a
  // themed blank view avoids a flash of the wrong root screen while it does.
  // No `useTheme()` here deliberately — this can render before `ThemeProvider`
  // mounts, same reasoning as `ConfigErrorScreen`.
  if (onboarding.status === "loading") {
    const colors = colorsByScheme[colorScheme === "dark" ? "dark" : "light"];
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocaleProvider>
        <ThemeProvider>
          <ToastProvider>
            <UpgradeGate>
              <RootStack onboardingCompleted={onboarding.completed} />
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

function RootStack({ onboardingCompleted }: { onboardingCompleted: boolean }) {
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
      {/* Mutually exclusive root screens: onboarding until it's completed
          (wizard finish/skip, or any successful sign-in — see
          `stores/onboarding.ts`), the tab stack after. */}
      <Stack.Protected guard={onboardingCompleted}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!onboardingCompleted}>
        {/* No swipe/back dismiss — it's the sole initial route with nothing
            behind it, and a fade suits an app-launch transition better than a
            directional slide. */}
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false, ...fadeTransition }}
        />
      </Stack.Protected>
      <Stack.Screen name="upgrade-required" />
      <Stack.Screen name="login" options={authOptions} />
      <Stack.Screen name="register" options={authOptions} />
      <Stack.Screen name="forgot-password" options={authOptions} />
    </Stack>
  );
}
