import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

type TabBarButtonProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /**
   * React Navigation's default tab button (`PlatformPressable`) forwards
   * these to enable a Material ripple / web hover effect on Android. They're
   * declared here only so they can be destructured out below and never
   * reach `Pressable` -- omitting `android_ripple` is what actually disables
   * the ripple; `Pressable` only renders one when the prop is set.
   */
  href?: string;
  pressColor?: unknown;
  pressOpacity?: unknown;
  hoverEffect?: unknown;
  android_ripple?: unknown;
};

/**
 * Bottom-tab button used via `screenOptions.tabBarButton`. Swaps out React
 * Navigation's `PlatformPressable` for a plain `Pressable` so the Android
 * ripple that spawns from the touch point never renders -- the pill behind
 * each icon (`TabBarIcon`) is the only feedback we want. Everything else
 * (press handlers, accessibility props, testID) passes through unchanged.
 */
export function TabBarButton({
  style,
  children,
  href: _href,
  pressColor: _pressColor,
  pressOpacity: _pressOpacity,
  hoverEffect: _hoverEffect,
  android_ripple: _androidRipple,
  ...rest
}: TabBarButtonProps) {
  return (
    <Pressable {...rest} android_disableSound style={style}>
      {children}
    </Pressable>
  );
}
