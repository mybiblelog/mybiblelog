import { StyleSheet } from "react-native";
import { Path } from "react-native-svg";
import { GoogleSignInButton } from "./GoogleSignInButton";
import {
  fireEvent,
  getAllByComponentType,
  renderWithProviders,
  screen,
} from "@/src/test-utils/renderWithProviders";

const backgroundOf = (testID: string) =>
  (
    StyleSheet.flatten(screen.getByTestId(testID).props.style as never) as {
      backgroundColor?: string;
    }
  ).backgroundColor;

describe("GoogleSignInButton", () => {
  it("renders its label", async () => {
    await renderWithProviders(<GoogleSignInButton label="Continue with Google" />);
    expect(screen.getByText("Continue with Google")).toBeTruthy();
  });

  // The four-color mark is brand-required: it must never be tinted down to a
  // single theme color the way `Icon` glyphs are.
  it("draws the official four-color G", async () => {
    await renderWithProviders(<GoogleSignInButton label="Continue with Google" />);
    const fills = getAllByComponentType(Path).map((path) => path.props.fill);
    expect(fills).toEqual(["#EA4335", "#4285F4", "#FBBC05", "#34A853"]);
  });

  it("calls onPress when tapped", async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <GoogleSignInButton label="Continue with Google" onPress={onPress} />
    );
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <GoogleSignInButton label="Continue with Google" onPress={onPress} disabled />
    );
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  // One scheme per test: a mount persists its theme mode, which the next
  // mount in the same test would load over its pinned scheme.
  it("uses Google's own light palette, not app theme colors", async () => {
    await renderWithProviders(<GoogleSignInButton label="Continue with Google" testID="google" />, {
      scheme: "light",
    });
    expect(backgroundOf("google")).toBe("#FFFFFF");
  });

  it("uses Google's own dark palette, not app theme colors", async () => {
    await renderWithProviders(<GoogleSignInButton label="Continue with Google" testID="google" />, {
      scheme: "dark",
    });
    expect(backgroundOf("google")).toBe("#131314");
  });
});
