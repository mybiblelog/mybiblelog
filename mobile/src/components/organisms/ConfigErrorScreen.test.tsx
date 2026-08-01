import { render, screen } from "@testing-library/react-native";
import { ConfigErrorScreen } from "./ConfigErrorScreen";

describe("ConfigErrorScreen", () => {
  it("names every missing env var", () => {
    render(
      <ConfigErrorScreen
        missing={["EXPO_PUBLIC_API_BASE_URL", "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"]}
      />
    );

    expect(screen.getByText("EXPO_PUBLIC_API_BASE_URL")).toBeTruthy();
    expect(screen.getByText("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID")).toBeTruthy();
  });

  it("renders without the provider tree it replaces", () => {
    // Rendered bare on purpose — no ThemeProvider/LocaleProvider/ToastProvider.
    // This screen exists for the case where configuration is broken, so it must
    // not depend on the providers the root layout skips mounting.
    expect(() =>
      render(<ConfigErrorScreen missing={["EXPO_PUBLIC_API_BASE_URL"]} />)
    ).not.toThrow();
    expect(screen.getByTestId("config-error.screen")).toBeTruthy();
  });
});
