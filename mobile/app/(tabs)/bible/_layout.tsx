import { Stack } from "expo-router";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useT } from "@/src/i18n/LocaleProvider";

export default function BibleLayout() {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("bible_books_title") }} />
      <Stack.Screen name="[book]" options={{ title: t("bible_book_title") }} />
    </Stack>
  );
}

