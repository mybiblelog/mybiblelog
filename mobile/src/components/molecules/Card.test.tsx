import { StyleSheet, Text } from "react-native";
import { colorsByScheme, radius, spacing } from "@/src/design";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";
import { Card } from "./Card";

/** Flatten the style array RN hands back so individual declarations can be read. */
const styleOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe("Card", () => {
  it("renders its children", () => {
    renderWithProviders(
      <Card>
        <Text>Inside</Text>
      </Card>
    );
    expect(screen.getByText("Inside")).toBeTruthy();
  });

  describe("padding", () => {
    it('defaults to "content" (web .mbl-card__content)', () => {
      renderWithProviders(
        <Card testID="c">
          <Text>x</Text>
        </Card>
      );
      expect(styleOf("c").padding).toBe(spacing.xl);
    });

    it('"list-item" is tighter vertically than horizontally (web .mbl-card--list-item)', () => {
      renderWithProviders(
        <Card testID="c" padding="list-item">
          <Text>x</Text>
        </Card>
      );
      const style = styleOf("c");
      expect(style.paddingVertical).toBe(spacing.xs);
      expect(style.paddingHorizontal).toBe(spacing.md);
      expect(style.padding).toBeUndefined();
    });

    it('"none" applies no padding', () => {
      renderWithProviders(
        <Card testID="c" padding="none">
          <Text>x</Text>
        </Card>
      );
      const style = styleOf("c");
      expect(style.padding).toBeUndefined();
      expect(style.paddingVertical).toBeUndefined();
    });
  });

  it("uses the elevated surface, not the plain one", () => {
    renderWithProviders(
      <Card testID="c">
        <Text>x</Text>
      </Card>
    );
    expect(styleOf("c").backgroundColor).toBe(colorsByScheme.light.surfaceElevated);
  });

  it("lifts off the canvas in dark mode", () => {
    renderWithProviders(
      <Card testID="c">
        <Text>x</Text>
      </Card>,
      { scheme: "dark" }
    );
    const style = styleOf("c");
    expect(style.backgroundColor).toBe(colorsByScheme.dark.surfaceElevated);
    expect(style.backgroundColor).not.toBe(colorsByScheme.dark.background);
    // The rim flips to light-on-dark so it still reads as an edge.
    const shadow = style.boxShadow as { color: string }[];
    expect(shadow.at(-1)?.color).toBe(colorsByScheme.dark.shadowRim);
  });

  // Regression guard for the Android bug where a background-only style update
  // drops a separately-registered borderRadius: the two must travel together.
  it("declares borderRadius in the same style object as backgroundColor", () => {
    renderWithProviders(
      <Card testID="c">
        <Text>x</Text>
      </Card>
    );
    const declarations = screen
      .getByTestId("c")
      .props.style.flat(Infinity)
      .filter(Boolean) as Record<string, unknown>[];
    const withBackground = declarations.find((d) => "backgroundColor" in d);
    expect(withBackground?.borderRadius).toBe(radius.card);
  });

  describe("elevation", () => {
    it("carries a resting shadow whose last layer is the 1px rim", () => {
      renderWithProviders(
        <Card testID="c">
          <Text>x</Text>
        </Card>
      );
      const shadow = styleOf("c").boxShadow as { spreadDistance?: number; color: string }[];
      expect(shadow.length).toBeGreaterThan(0);
      // In light mode the card and the canvas are the same color, so the rim is
      // the only thing separating them.
      expect(shadow.at(-1)?.spreadDistance).toBe(1);
      expect(shadow.at(-1)?.color).toBe(colorsByScheme.light.shadowRim);
    });

    it("omits the shadow when flat", () => {
      renderWithProviders(
        <Card testID="c" flat>
          <Text>x</Text>
        </Card>
      );
      expect(styleOf("c").boxShadow).toBeUndefined();
    });
  });

  describe("tone", () => {
    it("paints info callout chrome with a visible edge", () => {
      renderWithProviders(
        <Card testID="c" tone="info">
          <Text>x</Text>
        </Card>
      );
      const style = styleOf("c");
      expect(style.backgroundColor).toBe(colorsByScheme.light.messageInfoBg);
      expect(style.borderColor).toBe(colorsByScheme.light.messageInfoBorder);
      expect(style.borderWidth).toBe(StyleSheet.hairlineWidth);
    });

    it("leaves neutral cards borderless", () => {
      renderWithProviders(
        <Card testID="c">
          <Text>x</Text>
        </Card>
      );
      expect(styleOf("c").borderWidth).toBeUndefined();
    });
  });

  describe("onPress", () => {
    it("becomes a button and fires", () => {
      const onPress = jest.fn();
      renderWithProviders(
        <Card testID="c" onPress={onPress} accessibilityLabel="Open">
          <Text>x</Text>
        </Card>
      );
      fireEvent.press(screen.getByTestId("c"));
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
    });

    it("stays a plain view without onPress", () => {
      renderWithProviders(
        <Card testID="c">
          <Text>x</Text>
        </Card>
      );
      expect(screen.queryByRole("button")).toBeNull();
    });
  });
});
