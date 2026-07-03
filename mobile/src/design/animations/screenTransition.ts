/**
 * Shared navigation transition presets for Expo Router native stacks. Spread
 * into a `<Stack screenOptions={…}>` or a per-screen `options`.
 *
 *   <Stack screenOptions={stackTransition} />
 *   <Stack.Screen name="login" options={modalTransition} />
 *
 * Typed structurally (not via @react-navigation/native-stack, which isn't a
 * direct dependency — expo-router bundles its own fork). `as const` preserves
 * the string-literal `animation` values so they satisfy expo-router's option
 * types when spread.
 */
export const stackTransition = {
  animation: "slide_from_right",
  animationDuration: 280,
} as const;

/** Bottom-sheet style presentation for modal-like screens (e.g. login). */
export const modalTransition = {
  animation: "slide_from_bottom",
  animationDuration: 320,
} as const;

/** Cross-fade for tab roots / replacements where directional slide feels wrong. */
export const fadeTransition = {
  animation: "fade",
  animationDuration: 200,
} as const;
