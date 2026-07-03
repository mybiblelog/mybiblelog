import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/src/design";
import { LocaleProvider } from "@/src/i18n/LocaleProvider";
import { ToastProvider } from "@/src/toast/ToastProvider";

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/**
 * Renders a component wrapped in the providers required for `useTheme()`,
 * `useT()`, `useToast()` and safe-area insets to work. Use this for any
 * component or screen test that touches theming, translations or layout.
 */
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <LocaleProvider>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export the testing library so tests import everything from one place.
export * from "@testing-library/react-native";
