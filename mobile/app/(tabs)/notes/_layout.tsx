import { Stack } from "expo-router";
import { stackTransition, useTheme } from "@/src/design";

export default function NotesLayout() {
  const { colors } = useTheme();
  // Every screen renders its own title + back chevron via `ScreenHeader`, so the
  // native header would only duplicate it at a different size.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        ...stackTransition,
      }}
    />
  );
}
