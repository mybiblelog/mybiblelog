import { type ComponentType, type ReactNode, useCallback, useEffect, useRef } from "react";
import type { FlatListProps } from "react-native";
import Animated from "react-native-reanimated";
import { listItemEnter, listLayout } from "@/src/design";

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
export function AnimatedList<T>({ animateItemLayout = true, ...props }: AnimatedListProps<T>) {
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

  return <RNAnimatedFlatList {...props} CellRendererComponent={CellRendererComponent} />;
}
