import { Text } from "react-native";
import { ScreenHeader } from "./ScreenHeader";
import { typography } from "@/src/design";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("ScreenHeader", () => {
  it("renders the title with the single screen-title type style", () => {
    renderWithProviders(<ScreenHeader title="Appearance" />);
    const title = screen.getByText("Appearance");
    const flat = Object.assign({}, ...[title.props.style].flat(Infinity).filter(Boolean));
    expect(flat.fontSize).toBe(typography.title.fontSize);
  });

  it("renders a subtitle when given one", () => {
    renderWithProviders(<ScreenHeader title="Today" subtitle="August 8, 2026" />);
    expect(screen.getByText("August 8, 2026")).toBeTruthy();
  });

  it("omits the back chevron by default", () => {
    renderWithProviders(<ScreenHeader title="Settings" />);
    expect(screen.queryByTestId("screen-header.back")).toBeNull();
  });

  it("calls onBack when the back chevron is pressed", () => {
    const onBack = jest.fn();
    renderWithProviders(<ScreenHeader title="Account" back onBack={onBack} />);
    fireEvent.press(screen.getByTestId("screen-header.back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders trailing actions", () => {
    renderWithProviders(<ScreenHeader title="Notes" right={<Text>New</Text>} />);
    expect(screen.getByText("New")).toBeTruthy();
  });
});
