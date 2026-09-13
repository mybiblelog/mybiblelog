import { StyleSheet } from "react-native";
import { Button } from "./Button";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

const borderOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style as never) as {
    borderColor?: string;
    borderWidth?: number;
  };

describe("Button", () => {
  it("renders its label", () => {
    renderWithProviders(<Button label="Save" />);
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    renderWithProviders(<Button label="Save" onPress={onPress} />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    renderWithProviders(<Button label="Save" onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not call onPress while loading and hides the label", () => {
    const onPress = jest.fn();
    renderWithProviders(<Button label="Save" onPress={onPress} loading />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByText("Save")).toBeNull();
  });

  it("exposes disabled and busy accessibility state", () => {
    renderWithProviders(<Button label="Save" loading />);
    const button = screen.getByRole("button");
    expect(button.props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
  });

  it("uses an explicit accessibilityLabel over the visible label", () => {
    renderWithProviders(<Button label="X" accessibilityLabel="Close dialog" />);
    expect(screen.getByLabelText("Close dialog")).toBeTruthy();
  });

  // The translucent secondary fill needs its own border to read against a
  // same-colored surface. Disabled drops the accent tint for a neutral
  // border instead, so it no longer matches the enabled secondary border.
  it("outlines the secondary variant and keeps accent variants borderless", () => {
    renderWithProviders(
      <>
        <Button label="Secondary" variant="secondary" testID="secondary" />
        <Button label="Primary" testID="primary" />
        <Button label="Ghost" variant="ghost" testID="ghost" />
        <Button label="Off" variant="secondary" disabled testID="disabled" />
      </>
    );
    expect(borderOf("secondary")).toMatchObject({ borderWidth: 1 });
    expect(borderOf("secondary").borderColor).not.toBe("transparent");
    expect(borderOf("disabled").borderColor).not.toBe("transparent");
    expect(borderOf("primary").borderColor).toBe("transparent");
    expect(borderOf("ghost").borderColor).toBe("transparent");
  });
});
