import { SelectRow } from "./SelectRow";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("SelectRow", () => {
  it("shows the placeholder when there is no value", () => {
    renderWithProviders(<SelectRow placeholder="Choose a book" onPress={() => {}} />);
    expect(screen.getByText("Choose a book")).toBeTruthy();
  });

  it("shows the value when present", () => {
    renderWithProviders(
      <SelectRow placeholder="Choose a book" value="Genesis" onPress={() => {}} />
    );
    expect(screen.getByText("Genesis")).toBeTruthy();
    expect(screen.queryByText("Choose a book")).toBeNull();
  });

  it("treats 0 / empty string as no value (placeholder shown)", () => {
    renderWithProviders(<SelectRow placeholder="Pick" value={0} onPress={() => {}} />);
    expect(screen.getByText("Pick")).toBeTruthy();
  });

  it("fires onPress when enabled and not when disabled", () => {
    const onPress = jest.fn();
    const { rerender } = renderWithProviders(<SelectRow placeholder="Pick" onPress={onPress} />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(<SelectRow placeholder="Pick" onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1); // unchanged
  });
});
