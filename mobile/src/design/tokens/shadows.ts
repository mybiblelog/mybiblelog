import type { ViewStyle } from "react-native";
import type { ThemeColors } from "./colors";

/**
 * Elevation system, mirroring web's three layers
 * (`web/app/assets/css/tokens.css`):
 *
 *   1) Ink      — `shadowKey` / `shadowAmbient` / `shadowRim` in `ThemeColors`.
 *                 The ONLY layer the scheme overrides.
 *   2) Geometry — the `ladder` below, offsets/blur roughly doubling per step.
 *                 Colorless; never consumed directly by a component.
 *   3) Roles    — `makeShadows()` below. THIS is the layer components use.
 *                 Pick by what the element *is* (a card, a popover, a modal),
 *                 not by how heavy you want the shadow to look.
 *
 * Consume via the theme, which pre-builds the roles for the active scheme:
 *
 *   const { shadows } = useTheme();
 *   <View style={[styles.card, shadows.card]} />
 *
 * RN 0.86 supports multi-layer `boxShadow` with `spreadDistance`, so web's
 * shadows — including the 1px rim that separates same-color surfaces — port
 * exactly rather than degrading to a single blur.
 *
 * Two constraints on Android:
 *   - Do NOT also set `elevation`. Mixing it with `boxShadow` double-draws.
 *     `elevationFallback` below is kept unused for the case where `boxShadow`
 *     disappoints on real hardware.
 *   - A view with `boxShadow` needs an opaque `backgroundColor`, and the
 *     shadow is dropped under `overflow: "hidden"`. Wrap a clipping child in a
 *     shadow-bearing parent if you need both.
 */

type ShadowLayer = {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadDistance?: number;
  /** Which ink role fills this layer. */
  ink: "key" | "ambient" | "rim";
};

/** The 1px hairline that separates a card from a same-colored canvas. */
const rim: ShadowLayer = { offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, ink: "rim" };

/** Layer 2 — geometry only, mapped from web's `--mbl-shadow-1..4` and `-edge`. */
const ladder = {
  1: [{ offsetX: 0, offsetY: 1, blurRadius: 2, ink: "key" }, rim],
  2: [
    { offsetX: 0, offsetY: 2, blurRadius: 4, ink: "key" },
    { offsetX: 0, offsetY: 4, blurRadius: 8, ink: "ambient" },
    rim,
  ],
  3: [
    { offsetX: 0, offsetY: 4, blurRadius: 8, ink: "key" },
    { offsetX: 0, offsetY: 8, blurRadius: 20, ink: "ambient" },
    rim,
  ],
  4: [
    { offsetX: 0, offsetY: 8, blurRadius: 16, ink: "key" },
    { offsetX: 0, offsetY: 16, blurRadius: 40, ink: "ambient" },
    rim,
  ],
  /** Even cast for edge-anchored panels (web `--mbl-shadow-edge`). */
  edge: [{ offsetX: 0, offsetY: 0, blurRadius: 24, ink: "key" }, rim],
} as const satisfies Record<string, readonly ShadowLayer[]>;

/**
 * Android `elevation` equivalents per rung. Unused — documented so there's a
 * ready fallback if `boxShadow` renders poorly on a real device.
 */
export const elevationFallback = { 1: 2, 2: 4, 3: 8, 4: 12, edge: 6 } as const;

const inkFor = (colors: ThemeColors) => ({
  key: colors.shadowKey,
  ambient: colors.shadowAmbient,
  rim: colors.shadowRim,
});

const build = (layers: readonly ShadowLayer[], colors: ThemeColors): ViewStyle => {
  const ink = inkFor(colors);
  return {
    boxShadow: layers.map(({ ink: role, ...geometry }) => ({ ...geometry, color: ink[role] })),
  };
};

export type Shadows = {
  none: ViewStyle;
  /** Resting card / list tile (web `--mbl-shadow-card`). */
  card: ViewStyle;
  /** Card that should read as lifted off the page (web `--mbl-shadow-card-raised`). */
  cardRaised: ViewStyle;
  /** Menus, dropdowns, action sheets (web `--mbl-shadow-popover`). */
  popover: ViewStyle;
  /** FABs and floating controls (web `--mbl-shadow-floating`). */
  floating: ViewStyle;
  /** Modals and dialogs (web `--mbl-shadow-modal`). */
  modal: ViewStyle;
  /** Edge-anchored panels — bottom sheets (web `--mbl-shadow-panel`). */
  panel: ViewStyle;
};

/**
 * Layer 3 — build the semantic roles for a scheme. Called once by
 * `ThemeProvider`; components read the result off `useTheme().shadows`.
 *
 * Web's `--mbl-shadow-card-hover` / `-card-pressed` / `--mbl-focus-ring` /
 * `--mbl-ring-knockout` have no mobile counterpart: there is no hover and no
 * keyboard focus on touch, and press feedback here is `useScalePress`.
 * Web's `--mbl-ring-selected` maps to a real `borderWidth: 2` + `colors.link`,
 * which reads better than a spread shadow in RN.
 */
export function makeShadows(colors: ThemeColors): Shadows {
  return {
    none: { boxShadow: undefined },
    card: build(ladder[1], colors),
    cardRaised: build(ladder[2], colors),
    popover: build(ladder[3], colors),
    floating: build(ladder[3], colors),
    modal: build(ladder[4], colors),
    panel: build(ladder.edge, colors),
  };
}
