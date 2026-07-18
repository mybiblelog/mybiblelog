import { type ComponentType, useEffect, useState } from "react";
import type { FlatListProps, ListRenderItemInfo } from "react-native";
import Animated from "react-native-reanimated";
import { listItemEnter, listItemExit, listLayout } from "@/src/design";

// Reanimated's animated FlatList carries an awkward generic (every prop becomes
// a possible SharedValue). We keep the public `AnimatedList` props as a plain
// FlatListProps<T> and treat the inner animated list as untyped.
const RNAnimatedFlatList = Animated.FlatList as unknown as ComponentType<Record<string, unknown>>;

type AnimatedListProps<T> = FlatListProps<T> & {
  /**
   * Animate neighbors gliding into place on layout changes (Reanimated
   * `itemLayoutAnimation`). Default true. Set false for lists whose rows change
   * height *in place* (e.g. the checklist's expand/collapse): the layout
   * animation doesn't reflow sibling rows when an item grows, leaving them
   * overlapping on the New Architecture. Insert/remove animations are unaffected.
   */
  animateItemLayout?: boolean;
};

/**
 * FlatList with built-in motion: each item fades/slides in on insert, out on
 * removal, and neighbors glide into place on layout changes. Drop-in for
 * FlatList — pass the same props (data, renderItem, keyExtractor, …).
 *
 * Enter animations are enabled one frame after mount, so the initial dataset
 * renders immediately (no N simultaneous animations on a long list) and only
 * rows inserted afterwards animate in.
 */
export function AnimatedList<T>({
  renderItem,
  animateItemLayout = true,
  ...props
}: AnimatedListProps<T>) {
  const [animateInsertions, setAnimateInsertions] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimateInsertions(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <RNAnimatedFlatList
      {...props}
      itemLayoutAnimation={animateItemLayout ? listLayout() : undefined}
      renderItem={(info: ListRenderItemInfo<T>) => (
        <Animated.View
          entering={animateInsertions ? listItemEnter() : undefined}
          exiting={listItemExit()}
        >
          {renderItem ? renderItem(info) : null}
        </Animated.View>
      )}
    />
  );
}
