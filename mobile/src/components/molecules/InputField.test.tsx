import { InputField } from "./InputField";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("InputField", () => {
  it("renders a label and an error message", async () => {
    await renderWithProviders(<InputField label="Email" error="Required" value="" />);
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("forwards text changes", async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(
      <InputField label="Email" placeholder="you@example.com" onChangeText={onChangeText} />
    );
    await fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "hi@there.com");
    expect(onChangeText).toHaveBeenCalledWith("hi@there.com");
  });

  it("invokes onFocus and onBlur callbacks", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await renderWithProviders(<InputField placeholder="x" onFocus={onFocus} onBlur={onBlur} />);
    const input = screen.getByPlaceholderText("x");
    await fireEvent(input, "focus");
    await fireEvent(input, "blur");
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
  });
});
