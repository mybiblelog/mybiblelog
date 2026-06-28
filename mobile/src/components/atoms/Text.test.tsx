import { Text } from "./Text";
import { renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("Text", () => {
  it("renders its children", () => {
    renderWithProviders(<Text>Hello</Text>);
    expect(screen.getByText("Hello")).toBeTruthy();
  });

  it("applies a themed color and the variant's typography", () => {
    renderWithProviders(
      <Text variant="title" color="mutedText">
        Titled
      </Text>,
    );
    const node = screen.getByText("Titled");
    const flat = Array.isArray(node.props.style)
      ? Object.assign({}, ...node.props.style.flat())
      : node.props.style;
    expect(flat.color).toBeTruthy();
    expect(flat.fontSize).toBeGreaterThan(0);
  });

  it("forwards extra TextProps like numberOfLines", () => {
    renderWithProviders(<Text numberOfLines={1}>Clamped</Text>);
    expect(screen.getByText("Clamped").props.numberOfLines).toBe(1);
  });
});
