import { Button } from "./Button";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

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
});
