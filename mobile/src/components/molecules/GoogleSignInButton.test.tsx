import { StyleSheet } from "react-native";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

// react-native-svg hands the host its fill as a processed ARGB int.
const toHex = (argb: number) => `#${(argb & 0xffffff).toString(16).toUpperCase().padStart(6, "0")}`;

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
    const fills = screen.container
      .queryAll((node) => node.type === "RNSVGPath")
      .map((path) => toHex(path.props.fill.payload));
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

  it("uses Google's own palette per scheme, not app theme colors", async () => {
    await renderWithProviders(<GoogleSignInButton label="Continue with Google" testID="google" />, {
      scheme: "light",
    });
    expect(backgroundOf("google")).toBe("#FFFFFF");

    await screen.unmount();

    await renderWithProviders(<GoogleSignInButton label="Continue with Google" testID="google" />, {
      scheme: "dark",
    });
    expect(backgroundOf("google")).toBe("#131314");
  });
});
