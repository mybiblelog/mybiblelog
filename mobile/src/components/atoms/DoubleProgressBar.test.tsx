import { StyleSheet } from "react-native";
import { colorsByScheme, radius } from "@/src/design";
import { renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";
import { DoubleProgressBar } from "./DoubleProgressBar";

const styleOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe("DoubleProgressBar", () => {
  it("reports the primary measure to assistive tech", () => {
    renderWithProviders(<DoubleProgressBar primaryPercentage={62} secondaryPercentage={80} />);
    const bar = screen.getByTestId("double-progress-bar");
    expect(bar.props.accessibilityRole).toBe("progressbar");
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 62 });
  });

  it("renders the secondary fill dimmer than the primary", () => {
    renderWithProviders(<DoubleProgressBar primaryPercentage={40} secondaryPercentage={90} />);
    expect(styleOf("secondary-bar").opacity).toBe(0.7);
    expect(styleOf("primary-bar").opacity).toBeUndefined();
  });

  describe("clamping", () => {
    it("floors at 0", () => {
      renderWithProviders(<DoubleProgressBar primaryPercentage={-25} />);
      expect(screen.getByTestId("double-progress-bar").props.accessibilityValue.now).toBe(0);
    });

    it("caps at 100 so overshoot doesn't overflow the track", () => {
      renderWithProviders(<DoubleProgressBar primaryPercentage={340} />);
      expect(screen.getByTestId("double-progress-bar").props.accessibilityValue.now).toBe(100);
    });

    it("survives a non-finite percentage (goal of 0 divides by zero)", () => {
      expect(() =>
        renderWithProviders(<DoubleProgressBar primaryPercentage={NaN} secondaryPercentage={NaN} />)
      ).not.toThrow();
      expect(screen.getByTestId("double-progress-bar").props.accessibilityValue.now).toBe(0);
    });
  });

  describe("the completion rainbow", () => {
    it("stays off below the goal", () => {
      renderWithProviders(<DoubleProgressBar primaryPercentage={99} />);
      expect(screen.queryByTestId("primary-bar-complete")).toBeNull();
    });

    it("appears exactly at the goal", () => {
      renderWithProviders(<DoubleProgressBar primaryPercentage={100} />);
      expect(screen.getByTestId("primary-bar-complete")).toBeTruthy();
    });

    it("stays on past the goal, since overshoot is still complete", () => {
      renderWithProviders(<DoubleProgressBar primaryPercentage={250} />);
      expect(screen.getByTestId("primary-bar-complete")).toBeTruthy();
    });
  });

  it("keeps the track radius with its themed background (Android regression guard)", () => {
    renderWithProviders(<DoubleProgressBar primaryPercentage={10} />);
    const declarations = screen
      .getByTestId("double-progress-bar")
      .props.style.flat(Infinity)
      .filter(Boolean) as Record<string, unknown>[];
    const withBackground = declarations.find((d) => "backgroundColor" in d);
    expect(withBackground?.borderRadius).toBe(radius.lg);
  });

  it("takes its track and fill from theme roles", () => {
    renderWithProviders(<DoubleProgressBar primaryPercentage={10} />, { scheme: "dark" });
    expect(styleOf("double-progress-bar").backgroundColor).toBe(colorsByScheme.dark.progressTrack);
    expect(styleOf("primary-bar").backgroundColor).toBe(colorsByScheme.dark.linkBright);
  });
});
