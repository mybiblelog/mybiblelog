import { type ComponentType, type ReactNode, useCallback, useEffect, useRef } from "react";
import { StyleSheet, type FlatListProps, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { listItemEnter, listLayout, spacing } from "@/src/design";

/**
 * Room reserved for row shadows. A scroll view clips to its own bounds, so a
 * row that spans the full content width has the left and right edge of its
 * shadow — including the 1px rim that separates a card from the canvas —
 * shaved off, and the first row loses its top edge the same way. 4pt covers
 * the widest cast of the `card`/`cardRaised` roles (blur 8 ⇒ 4pt beyond the
 * box). The bottom needs no allowance: lists pad it with `spacing.listBottom`.
 */
const SHADOW_BLEED = spacing["2xs"];

// Reanimated's animated FlatList carries an awkward generic (every prop becomes
// a possible SharedValue). We keep the public `AnimatedList` props as a plain
// FlatListProps<T> and treat the inner animated list as untyped.
const RNAnimatedFlatList = Animated.FlatList as unknown as ComponentType<Record<string, unknown>>;

type AnimatedListProps<T> = FlatListProps<T> & {
  /**
   * Animate neighbors gliding into place on layout changes (Reanimated
   * `layout`). Default true. Set false for lists whose rows change height *in
   * place* (e.g. the checklist's expand/collapse): the layout animation doesn't
   * reflow sibling rows when an item grows, leaving them overlapping on the New
   * Architecture. Insert animations are unaffected.
   */
  animateItemLayout?: boolean;
};

// Props FlatList feeds its CellRendererComponent that aren't valid View props;
// pulled out so they don't spread onto the native view.
type CellProps = {
  children?: ReactNode;
  index?: number;
  item?: unknown;
  cellKey?: string;
};

/**
 * FlatList with built-in motion: each item fades/slides in on insert, and
 * neighbors glide into place on layout changes. Drop-in for FlatList — pass the
 * same props (data, renderItem, keyExtractor, …).
 *
 * Rows are NOT given a Reanimated `exiting` animation. On the New Architecture
 * (this app runs `newArchEnabled`), exiting animations inside a FlatList are
 * unreliable: the removed cell's exit frequently never runs to completion, so
 * its snapshot is left holding the row's vertical space — a gap that never
 * closes (see reanimated#5656 / #8665). Removing on delete is therefore
 * instant; the layout animation still reflows the surviving rows into place.
 *
 * Enter/layout animations live on the FlatList *cell* (via
 * `CellRendererComponent`) rather than a view nested inside `renderItem`, so the
 * element that owns a row's vertical space is the one Reanimated drives.
 *
 * Enter animations are enabled one frame after mount, so the initial dataset
 * renders immediately (no N simultaneous animations on a long list) and only
 * rows inserted afterwards animate in.
 */
export function AnimatedList<T>({
  animateItemLayout = true,
  style,
  contentContainerStyle,
  ...props
}: AnimatedListProps<T>) {
  // A ref (not state) so flipping it doesn't change the cell component's
  // identity and remount every row; each cell reads the value when it mounts.
  const animateInsertions = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      animateInsertions.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const CellRendererComponent = useCallback(
    ({ children, index: _index, item: _item, cellKey: _cellKey, ...cellProps }: CellProps) => (
      <Animated.View
        {...cellProps}
        entering={animateInsertions.current ? listItemEnter() : undefined}
        layout={animateItemLayout ? listLayout() : undefined}
      >
        {children}
      </Animated.View>
    ),
    [animateItemLayout]
  );

  // Grow the list past its container by the bleed and hand the same amount back
  // as content padding: rows land exactly where the caller put them, but now
  // with the shadow inside the clip bounds. The caller's own padding is
  // preserved by adding to it rather than replacing it.
  const flatContent = StyleSheet.flatten(contentContainerStyle) as ViewStyle | undefined;
  const padOf = (value: ViewStyle["padding"]) => (typeof value === "number" ? value : 0);

  return (
    <RNAnimatedFlatList
      {...props}
      style={[styles.bleed, style]}
      contentContainerStyle={[
        contentContainerStyle,
        {
          paddingHorizontal: padOf(flatContent?.paddingHorizontal) + SHADOW_BLEED,
          paddingTop: padOf(flatContent?.paddingTop) + SHADOW_BLEED,
        },
      ]}
      CellRendererComponent={CellRendererComponent}
    />
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -SHADOW_BLEED, marginTop: -SHADOW_BLEED },
});
