import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { radius, spacing, TOUCH_TARGET, useScalePress, useTheme } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Text } from "../atoms/Text";

/* eslint-disable no-restricted-syntax -- brand-required hex; the web port carries
   the same exemption as `stylelint-disable declaration-property-value-allowed-list`. */

/**
 * Google's sign-in palette, vendored from their branding spec the same way
 * web's `.gsi-material-button` CSS is (`web/app/components/forms/GoogleLoginButton.vue`).
 * These are brand-required values — do not swap them for app theme tokens.
 */
const GOOGLE_PALETTE = {
  light: { background: "#FFFFFF", border: "#747775", text: "#1F1F1F" },
  dark: { background: "#131314", border: "#8E918F", text: "#E3E3E3" },
} as const;

/** Icon box and label metrics are fixed by the spec, not by our ladders. */
const MARK_SIZE = 20;

/**
 * The official four-color "G". Paths are copied verbatim from web's
 * `GoogleLoginButton.vue`, which vendors them from Google's branding spec.
 */
function GoogleGMark() {
  return (
    <Svg width={MARK_SIZE} height={MARK_SIZE} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}
/* eslint-enable no-restricted-syntax */

export type GoogleSignInButtonProps = {
  /** One of Google's approved strings, e.g. `t("login_with_google")`. */
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Sign in with Google. Deliberately not the `Button` atom: Google's guidelines
 * fix the palette, the border, and the four-color mark, and `Button`'s
 * `leftIcon` tints its glyph with a single theme color. This is the mobile port
 * of web's `GoogleLoginButton.vue` — same spec, same metrics.
 *
 * Web's hover / `:active` state layer has no touch analogue, so press feedback
 * falls back to the app's standard scale + dim.
 */
export function GoogleSignInButton({
  label,
  onPress,
  disabled = false,
  fullWidth = false,
  testID,
  style,
}: GoogleSignInButtonProps) {
  const { scheme } = useTheme();
  const press = useScalePress({ disabled });
  const palette = GOOGLE_PALETTE[scheme];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID={testID}
      onPress={disabled ? undefined : onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      hitSlop={8}
      style={[
        styles.base,
        // Radius rides along with the colors: Android drops a registered
        // style's borderRadius when only the background changes on re-render.
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderRadius: radius.button,
        },
        fullWidth && styles.fullWidth,
        press.animatedStyle,
        // Matches web's `:disabled` contents/icon opacity.
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        <GoogleGMark />
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    // Web pins 40px; the platform touch target wins on a phone and the spec
    // allows the button to scale.
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.38 },
  // Type is part of the branding spec (Roboto Medium 14 / 0.25 tracking), so it
  // overrides the `Text` atom's variant instead of using one of ours. Roboto is
  // already the Android system face; iOS falls back to the system font.
  label: { fontSize: 14, fontWeight: "500", letterSpacing: 0.25, lineHeight: 20 },
});
