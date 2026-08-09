import { View } from "react-native";
import { Path } from "react-native-svg";
import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";
import { Spacer } from "./Spacer";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

describe("Icon", () => {
  it("renders without crashing", () => {
    expect(() => renderWithProviders(<Icon name="book-outline" />)).not.toThrow();
  });

  it("draws the local SVG plus for the add glyph", () => {
    const { UNSAFE_getByType } = renderWithProviders(<Icon name="add" />);
    expect(UNSAFE_getByType(Path).props.d).toBe("M12 5V19M5 12H19");
  });
});

describe("Skeleton", () => {
  it("renders a placeholder block", () => {
    expect(() => renderWithProviders(<Skeleton width={100} height={20} />)).not.toThrow();
  });
});

describe("Spacer", () => {
  it("renders a token-sized vertical gap", () => {
    const { UNSAFE_getByType } = renderWithProviders(<Spacer size="lg" />);
    const style = UNSAFE_getByType(View).props.style;
    expect(style.height).toBeGreaterThan(0);
    expect(style.width).toBeUndefined();
  });

  it("renders a horizontal gap with a numeric size", () => {
    const { UNSAFE_getByType } = renderWithProviders(<Spacer size={24} horizontal />);
    expect(UNSAFE_getByType(View).props.style).toEqual({ width: 24 });
  });
});
