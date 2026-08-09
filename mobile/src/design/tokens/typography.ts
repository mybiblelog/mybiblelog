import type { TextStyle } from "react-native";

/**
 * Named text styles. The `<Text variant="…">` atom maps its `variant` prop
 * onto these, so screens should rarely set fontSize/fontWeight directly.
 *
 * The trailing `screenTitle` / `sectionLabel` / `buttonLabel` aliases preserve
 * the names used before the design-system consolidation.
 */
export const typography = {
  /**
   * The one top-level screen title size, app-wide. Exactly one per screen, and
   * always through `<ScreenHeader>` — never set directly, and never used for a
   * heading *within* a screen.
   */
  title: { fontSize: 28, fontWeight: "800", lineHeight: 34 } as TextStyle,
  /** Heading inside a screen: section, card, sheet, modal. Never a screen title. */
  heading: { fontSize: 20, fontWeight: "800", lineHeight: 26 } as TextStyle,
  /** Secondary line under a title. */
  subtitle: { fontSize: 13, fontWeight: "700", lineHeight: 18 } as TextStyle,
  /** Default body copy. */
  body: { fontSize: 15, fontWeight: "500", lineHeight: 21 } as TextStyle,
  /** Emphasized body copy. */
  bodyStrong: { fontSize: 15, fontWeight: "700", lineHeight: 21 } as TextStyle,
  /** Grouping label above cards / inputs. */
  label: { fontSize: 13, fontWeight: "800", lineHeight: 18 } as TextStyle,
  /** Small print / metadata. */
  caption: { fontSize: 12, fontWeight: "600", lineHeight: 16 } as TextStyle,
  /** Button label. */
  button: { fontSize: 16, fontWeight: "800", lineHeight: 20 } as TextStyle,

  // --- Back-compat aliases (pre-consolidation names) ---
  screenTitle: { fontSize: 28, fontWeight: "800" } as TextStyle,
  sectionLabel: { fontSize: 13, fontWeight: "800" } as TextStyle,
  buttonLabel: { fontSize: 16, fontWeight: "800" } as TextStyle,
} as const;

export type TypographyVariant =
  "title" | "heading" | "subtitle" | "body" | "bodyStrong" | "label" | "caption" | "button";
