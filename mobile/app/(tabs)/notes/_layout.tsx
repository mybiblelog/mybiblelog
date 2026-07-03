import { Stack } from "expo-router";
import { stackTransition, useTheme } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";

export default function NotesLayout() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        ...stackTransition,
      }}
    >
      {/* The index screen renders its own in-content header (like the other tabs). */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="tags" options={{ title: t("tags_title") }} />
    </Stack>
  );
}
