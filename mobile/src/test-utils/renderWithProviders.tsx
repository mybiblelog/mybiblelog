import type { ReactElement, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, type RenderOptions } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/src/design";
import type { ColorSchemeName } from "@/src/design";
import { LocaleProvider } from "@/src/i18n/LocaleProvider";
import { ToastProvider } from "@/src/toast/ToastProvider";

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/**
 * Renders a component wrapped in the providers required for `useTheme()`,
 * `useT()`, `useToast()`, safe-area insets and gesture detectors to work. Use
 * this for any component or screen test that touches theming, translations or
 * layout.
 */
function makeWrapper(scheme?: ColorSchemeName) {
  return function AllProviders({ children }: { children: ReactNode }) {
    return (
      // Mirrors the root layout: Gesture Handler 3's detectors throw outside a root view.
      <GestureHandlerRootView>
        <SafeAreaProvider initialMetrics={safeAreaMetrics}>
          <LocaleProvider>
            {/* Pinning the mode beats stubbing what the OS reports: no spy to
                leak its return value into the next test in the file. */}
            <ThemeProvider initialMode={scheme ?? "system"}>
              <ToastProvider>{children}</ToastProvider>
            </ThemeProvider>
          </LocaleProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  };
}

const defaultWrapper = makeWrapper();

// RNTL's async render flushes mount effects (e.g. ThemeProvider loading and
// re-persisting the theme mode) before a test's first assertion, so storage
// written by an earlier test in the file would override a pinned `scheme`.
// Registered here, like RNTL's own auto-cleanup, for every file using this.
beforeEach(() => AsyncStorage.clear());

type Options = Omit<RenderOptions, "wrapper"> & {
  /** Force a color scheme. Without it the provider follows the system default. */
  scheme?: ColorSchemeName;
};

export function renderWithProviders(ui: ReactElement, { scheme, ...options }: Options = {}) {
  return render(ui, { wrapper: scheme ? makeWrapper(scheme) : defaultWrapper, ...options });
}

// Re-export the testing library so tests import everything from one place.
export * from "@testing-library/react-native";
export * from "./componentQueries";
