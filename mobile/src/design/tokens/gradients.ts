import { brand } from "./colors";
import type { ColorSchemeName } from "./colors";

/** Top-left → bottom-right stop pair for `expo-linear-gradient`. */
export type Gradient = readonly [string, string];

export type Gradients = {
  /** Primary button / accent fill — diagonal sweep across the two brand hues. */
  primary: Gradient;
};

export const gradientsByScheme: Record<ColorSchemeName, Gradients> = {
  light: { primary: [brand.primary, brand.secondary] },
  dark: { primary: [brand.primary, brand.secondary] },
};
