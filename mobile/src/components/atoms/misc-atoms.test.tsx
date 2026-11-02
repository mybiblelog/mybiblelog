import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";
import { Spacer } from "./Spacer";
import { renderWithProviders, type TestInstance } from "@/src/test-utils/renderWithProviders";

// The Spacer is the innermost (childless) View under the provider wrappers.
const spacerStyle = (container: TestInstance) =>
  container.queryAll((node) => node.type === "View" && node.children.length === 0)[0]?.props.style;

describe("Icon", () => {
  it("renders without crashing", async () => {
    await expect(renderWithProviders(<Icon name="book-outline" />)).resolves.toBeDefined();
  });

  it("draws the local SVG plus for the add glyph", async () => {
    const { container } = await renderWithProviders(<Icon name="add" />);
    const [path] = container.queryAll((node) => node.type === "RNSVGPath");
    expect(path?.props.d).toBe("M12 5V19M5 12H19");
  });
});

describe("Skeleton", () => {
  it("renders a placeholder block", async () => {
    await expect(renderWithProviders(<Skeleton width={100} height={20} />)).resolves.toBeDefined();
  });
});

describe("Spacer", () => {
  it("renders a token-sized vertical gap", async () => {
    const { container } = await renderWithProviders(<Spacer size="lg" />);
    const style = spacerStyle(container);
    expect(style.height).toBeGreaterThan(0);
    expect(style.width).toBeUndefined();
  });

  it("renders a horizontal gap with a numeric size", async () => {
    const { container } = await renderWithProviders(<Spacer size={24} horizontal />);
    expect(spacerStyle(container)).toEqual({ width: 24 });
  });
});
