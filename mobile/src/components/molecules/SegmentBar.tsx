import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { radius, useTheme } from "@/src/design";

export type SegmentBarSegment = {
  id: string;
  read: boolean;
  verseCount: number;
};

/** Proportional read/unread progress bar split into weighted segments. */
export function SegmentBar({
  segments,
  thick,
}: {
  segments: SegmentBarSegment[];
  thick?: boolean;
}) {
  const { colors } = useTheme();
  const data = useMemo(
    () => segments.filter((s) => Number.isFinite(s.verseCount) && s.verseCount > 0),
    [segments]
  );

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.border, height: thick ? 12 : 8 },
      ]}
    >
      {data.map((seg) => (
        <View
          key={seg.id}
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
