import type { ComponentType } from "react";
import type { FlatListProps, ListRenderItemInfo } from "react-native";
import Animated from "react-native-reanimated";
import { listItemEnter, listItemExit, listLayout } from "@/src/design";

// Reanimated's animated FlatList carries an awkward generic (every prop becomes
// a possible SharedValue). We keep the public `AnimatedList` props as a plain
// FlatListProps<T> and treat the inner animated list as untyped.
const RNAnimatedFlatList = Animated.FlatList as unknown as ComponentType<
  Record<string, unknown>
>;

/**
 * FlatList with built-in motion: each item fades/slides in on insert, out on
 * removal, and neighbors glide into place on layout changes. Drop-in for
 * FlatList — pass the same props (data, renderItem, keyExtractor, …).
 */
export function AnimatedList<T>({ renderItem, ...props }: FlatListProps<T>) {
  return (
    <RNAnimatedFlatList
      {...props}
      itemLayoutAnimation={listLayout()}
      renderItem={(info: ListRenderItemInfo<T>) => (
        <Animated.View entering={listItemEnter()} exiting={listItemExit()}>
          {renderItem ? renderItem(info) : null}
        </Animated.View>
      )}
    />
  );
}
