import { colorsByScheme, radius, spacing } from "./index";

/**
 * These assert the *values*, not just that tokens exist.
 *
 * The ladders were migrated onto web's scale in one pass, and the failure mode
 * that pass was designed around is a silent one: a wrong number still compiles
 * and still passes every other test. Pinning the values turns any later drift
 * into a named failure here rather than a 2px shift someone notices weeks on.
 *
 * The reference is `web/app/assets/css/tokens.css`. If a value changes there,
 * change it here in the same commit.
 */
describe("design tokens", () => {
  it("mirrors web's 4pt spacing ladder", () => {
    expect(spacing).toEqual({
      "3xs": 2,
      "2xs": 4,
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
      "2xl": 32,
      "3xl": 48,
      "4xl": 64,
      pageGutter: 16,
      pageTop: 16,
      listBottom: 24,
    });
  });

  it("mirrors web's radius ladder, with the semantic aliases web uses", () => {
    expect(radius).toEqual({
      xs: 2,
      sm: 4,
      md: 6,
      lg: 8,
      xl: 12,
      "2xl": 16,
      "3xl": 24,
      pill: 999,
      card: 16,
      button: 999,
      sheet: 16,
    });
  });

  it("keeps status colors identical to web's", () => {
    for (const scheme of ["light", "dark"] as const) {
      const colors = colorsByScheme[scheme];
      expect(colors.destructive).toBe("#f14668"); // --mbl-danger
      expect(colors.success).toBe("#48c774"); // --mbl-success
      expect(colors.warning).toBe("#ffdd57"); // --mbl-warning
      expect(colors.info).toBe("#3298dc"); // --mbl-info
    }
  });

  it("lifts the elevated surface above the canvas in dark but not light", () => {
    // Web's --mbl-bg-elevated equals --mbl-bg in light and --mbl-bg-muted in
    // dark, so cards read against the #000 canvas. In light the separation
    // comes entirely from the card shadow's rim layer.
    expect(colorsByScheme.light.surfaceElevated).toBe(colorsByScheme.light.surface);
    expect(colorsByScheme.dark.surfaceElevated).not.toBe(colorsByScheme.dark.surface);
    expect(colorsByScheme.dark.surfaceElevated).toBe(colorsByScheme.dark.surfaceMuted);
  });

  it("defines every semantic role in both schemes", () => {
    const light = Object.keys(colorsByScheme.light).sort();
    const dark = Object.keys(colorsByScheme.dark).sort();
    expect(light).toEqual(dark);
  });

  it("gives shadows their own ink, flipping the rim to light-on-dark", () => {
    // The ink is the only layer of the shadow system the scheme overrides.
    expect(colorsByScheme.light.shadowRim).toBe("rgba(10,10,10,0.04)");
    expect(colorsByScheme.dark.shadowRim).toBe("rgba(255,255,255,0.06)");
  });
});
