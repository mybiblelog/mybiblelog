import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { radius, useTheme } from "@/src/design";

/**
 * Structural shape of a progress segment — assignable from the shared
 * `Segment` type produced by `computeBibleProgress`. Keyed by `startVerseId`,
 * which is unique within a single bar.
 */
export type SegmentBarSegment = {
  startVerseId: number;
  read: boolean;
  verseCount: number;
};

/** Proportional read/unread progress bar split into weighted segments. */
function SegmentBarComponent({
  segments,
  thick,
}: {
  segments: readonly SegmentBarSegment[];
  thick?: boolean;
}) {
  const { colors } = useTheme();
  const data = useMemo(
    () => segments.filter((s) => Number.isFinite(s.verseCount) && s.verseCount > 0),
    [segments]
  );

  return (
    <View style={[styles.bar, { backgroundColor: colors.border, height: thick ? 12 : 8 }]}>
      {data.map((seg) => (
        <View
          key={seg.startVerseId}
          style={[
            styles.segment,
            {
              flexGrow: seg.verseCount,
              backgroundColor: seg.read ? colors.primary : "transparent",
            },
          ]}
        />
      ))}
    </View>
  );
}

// Segment arrays come reference-stable from the precomputed store, so memoizing
// avoids re-rendering every bar when a parent list re-renders.
export const SegmentBar = memo(SegmentBarComponent);

const styles = StyleSheet.create({
  bar: {
    borderRadius: radius.pill,
    overflow: "hidden",
    flexDirection: "row",
  },
  segment: {
    height: "100%",
  },
});
