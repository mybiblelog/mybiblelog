import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react-native";
import { ThemeProvider } from "@/src/design";
import { LocaleProvider } from "@/src/i18n/LocaleProvider";

/**
 * Renders a component wrapped in the providers required for `useTheme()` and
 * `useT()` to work. Use this for any component test that touches theming or
 * translations (most of the component library).
 */
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </LocaleProvider>
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
