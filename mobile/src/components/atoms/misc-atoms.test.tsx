import { View } from "react-native";
import { Path } from "react-native-svg";
import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";
import { Spacer } from "./Spacer";
import {
  getByComponentType,
  render,
  renderWithProviders,
} from "@/src/test-utils/renderWithProviders";

describe("Icon", () => {
  it("renders without crashing", async () => {
    await expect(renderWithProviders(<Icon name="book-outline" />)).resolves.toBeDefined();
  });

  it("draws the local SVG plus for the add glyph", async () => {
    await renderWithProviders(<Icon name="add" />);
    expect(getByComponentType(Path).props.d).toBe("M12 5V19M5 12H19");
  });
});

describe("Skeleton", () => {
  it("renders a placeholder block", async () => {
    await expect(renderWithProviders(<Skeleton width={100} height={20} />)).resolves.toBeDefined();
  });
});

// Spacer needs no providers; a bare render keeps its View the only one in the tree.
describe("Spacer", () => {
  it("renders a token-sized vertical gap", async () => {
    await render(<Spacer size="lg" />);
    const style = getByComponentType(View).props.style;
    expect(style.height).toBeGreaterThan(0);
    expect(style.width).toBeUndefined();
  });

  it("renders a horizontal gap with a numeric size", async () => {
    await render(<Spacer size={24} horizontal />);
    expect(getByComponentType(View).props.style).toEqual({ width: 24 });
  });
});
