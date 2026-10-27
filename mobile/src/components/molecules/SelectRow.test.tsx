import { SelectRow } from "./SelectRow";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("SelectRow", () => {
  it("shows the placeholder when there is no value", async () => {
    await renderWithProviders(<SelectRow placeholder="Choose a book" onPress={() => {}} />);
    expect(screen.getByText("Choose a book")).toBeTruthy();
  });

  it("shows the value when present", async () => {
    await renderWithProviders(
      <SelectRow placeholder="Choose a book" value="Genesis" onPress={() => {}} />
    );
    expect(screen.getByText("Genesis")).toBeTruthy();
    expect(screen.queryByText("Choose a book")).toBeNull();
  });

  it("treats 0 / empty string as no value (placeholder shown)", async () => {
    await renderWithProviders(<SelectRow placeholder="Pick" value={0} onPress={() => {}} />);
    expect(screen.getByText("Pick")).toBeTruthy();
  });

  it("fires onPress when enabled and not when disabled", async () => {
    const onPress = jest.fn();
    const { rerender } = await renderWithProviders(
      <SelectRow placeholder="Pick" onPress={onPress} />
    );
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);

    await rerender(<SelectRow placeholder="Pick" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1); // unchanged
  });
});
