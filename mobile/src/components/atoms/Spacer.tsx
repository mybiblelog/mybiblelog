import { View } from "react-native";
import { spacing } from "@/src/design";

type SpacingKey = keyof typeof spacing;

/** Token-sized gap. `<Spacer size="lg" />` or `<Spacer size={20} horizontal />`. */
export function Spacer({
  size = "md",
  horizontal = false,
}: {
  size?: SpacingKey | number;
  horizontal?: boolean;
}) {
  const value = typeof size === "number" ? size : spacing[size];
  return <View style={horizontal ? { width: value } : { height: value }} />;
}
