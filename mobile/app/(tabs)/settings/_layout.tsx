import { Stack } from "expo-router";
import { useTheme } from "@/src/theme/ThemeProvider";

export default function SettingsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="account" options={{ title: "Account" }} />
      <Stack.Screen name="reading" options={{ title: "Reading" }} />
      <Stack.Screen name="appearance" options={{ title: "Appearance" }} />
      <Stack.Screen name="language" options={{ title: "Language" }} />
    </Stack>
  );
}

