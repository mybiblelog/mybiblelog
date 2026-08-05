import { StyleSheet, View } from "react-native";
import { radius, spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { Skeleton } from "../atoms/Skeleton";
import { Card } from "./Card";

export type SkeletonListVariant = "log-entry" | "note";

/**
 * Placeholder rows shown while a list loads — the mobile counterpart of web's
 * `SkeletonLoader.vue`.
 *
 * These sit in real `Card`s with the padding the loaded rows use, so the list
 * doesn't reflow when content arrives.
 */
export function SkeletonList({
  variant = "log-entry",
  count = 1,
  testID,
}: {
  variant?: SkeletonListVariant;
  count?: number;
  testID?: string;
}) {
  const t = useT();

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={t("loading")}
      style={styles.list}
    >
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} padding="list-item">
          {variant === "log-entry" ? (
            <View style={styles.row}>
              <View style={styles.body}>
                <Skeleton width={144} height={16} radius={radius.sm} />
                <Skeleton width={96} height={12} radius={radius.sm} />
              </View>
              <Skeleton width={28} height={28} radius={radius.sm} />
            </View>
          ) : (
            <View style={styles.body}>
              <View style={styles.row}>
                <Skeleton width={120} height={16} radius={radius.sm} />
                <Skeleton width={56} height={12} radius={radius.sm} />
              </View>
              <Skeleton height={12} radius={radius.sm} />
              <Skeleton width="70%" height={12} radius={radius.sm} />
              <Skeleton width={72} height={16} radius={radius.pill} />
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  body: { flex: 1, gap: spacing["2xs"] },
});
