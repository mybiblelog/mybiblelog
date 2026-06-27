import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";

export type SegmentBarSegment = {
  id: string;
  read: boolean;
  verseCount: number;
};

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
    borderRadius: 999,
    overflow: "hidden",
    flexDirection: "row",
  },
  segment: {
    height: "100%",
  },
});

