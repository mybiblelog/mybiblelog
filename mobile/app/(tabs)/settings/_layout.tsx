import { Stack } from "expo-router";
import { stackTransition, useTheme } from "@/src/design";

export default function SettingsLayout() {
  const { colors } = useTheme();
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
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="account" options={{ title: "Account" }} />
      <Stack.Screen name="reading" options={{ title: "Reading" }} />
      <Stack.Screen name="insights" options={{ title: "Insights" }} />
      <Stack.Screen name="appearance" options={{ title: "Appearance" }} />
      <Stack.Screen name="language" options={{ title: "Language" }} />
      <Stack.Screen name="about" options={{ title: "About" }} />
      <Stack.Screen name="delete-account" options={{ title: "Delete Account" }} />
    </Stack>
  );
}
