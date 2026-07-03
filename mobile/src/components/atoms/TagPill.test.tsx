import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { TagPill } from "./TagPill";

describe("TagPill", () => {
  it("renders the label on the tag color", () => {
    const { getByText } = renderWithProviders(<TagPill label="Prayer" color="#00aaf9" />);
    expect(getByText("Prayer")).toBeTruthy();
  });

  it("uses white text on dark colors and black text on light colors", () => {
    const dark = renderWithProviders(<TagPill label="dark" color="#000000" />);
    expect(dark.getByText("dark")).toHaveStyle({ color: "#ffffff" });

    const light = renderWithProviders(<TagPill label="light" color="#fdd835" />);
    expect(light.getByText("light")).toHaveStyle({ color: "#000000" });
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <TagPill label="Prayer" color="#00aaf9" onPress={onPress} />
    );
    fireEvent.press(getByLabelText("Prayer"));
    expect(onPress).toHaveBeenCalled();
  });
});
