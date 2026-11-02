import { IconButton } from "./IconButton";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("IconButton", () => {
  it("calls onPress when tapped", async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <IconButton name="close" accessibilityLabel="Close" onPress={onPress} />
    );
    await fireEvent.press(screen.getByLabelText("Close"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled and reflects disabled state", async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <IconButton name="close" accessibilityLabel="Close" onPress={onPress} disabled />
    );
    const button = screen.getByLabelText("Close");
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
  });
});
