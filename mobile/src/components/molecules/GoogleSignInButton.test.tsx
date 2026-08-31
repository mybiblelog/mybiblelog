import { StyleSheet } from "react-native";
import { Path } from "react-native-svg";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

const backgroundOf = (testID: string) =>
  (
    StyleSheet.flatten(screen.getByTestId(testID).props.style as never) as {
      backgroundColor?: string;
    }
  ).backgroundColor;

describe("GoogleSignInButton", () => {
  it("renders its label", () => {
    renderWithProviders(<GoogleSignInButton label="Continue with Google" />);
    expect(screen.getByText("Continue with Google")).toBeTruthy();
  });

  // The four-color mark is brand-required: it must never be tinted down to a
  // single theme color the way `Icon` glyphs are.
  it("draws the official four-color G", () => {
    renderWithProviders(<GoogleSignInButton label="Continue with Google" />);
    const fills = screen.UNSAFE_getAllByType(Path).map((path) => path.props.fill);
    expect(fills).toEqual(["#EA4335", "#4285F4", "#FBBC05", "#34A853"]);
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    renderWithProviders(<GoogleSignInButton label="Continue with Google" onPress={onPress} />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    renderWithProviders(
      <GoogleSignInButton label="Continue with Google" onPress={onPress} disabled />
    );
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("uses Google's own palette per scheme, not app theme colors", () => {
    renderWithProviders(<GoogleSignInButton label="Continue with Google" testID="google" />, {
      scheme: "light",
    });
    expect(backgroundOf("google")).toBe("#FFFFFF");

    screen.unmount();

    renderWithProviders(<GoogleSignInButton label="Continue with Google" testID="google" />, {
      scheme: "dark",
    });
    expect(backgroundOf("google")).toBe("#131314");
  });
});
