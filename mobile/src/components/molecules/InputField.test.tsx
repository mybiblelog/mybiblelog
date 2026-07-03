import { InputField } from "./InputField";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("InputField", () => {
  it("renders a label and an error message", () => {
    renderWithProviders(<InputField label="Email" error="Required" value="" />);
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("forwards text changes", () => {
    const onChangeText = jest.fn();
    renderWithProviders(
      <InputField label="Email" placeholder="you@example.com" onChangeText={onChangeText} />
    );
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "hi@there.com");
    expect(onChangeText).toHaveBeenCalledWith("hi@there.com");
  });

  it("invokes onFocus and onBlur callbacks", () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    renderWithProviders(<InputField placeholder="x" onFocus={onFocus} onBlur={onBlur} />);
    const input = screen.getByPlaceholderText("x");
    fireEvent(input, "focus");
    fireEvent(input, "blur");
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
  });
});
