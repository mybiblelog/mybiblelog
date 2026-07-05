import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/design";
import { AttentionDot } from "@/src/components";
import { useIsUnauthenticated } from "@/src/stores/auth";

export default function TabsLayout() {
  const t = useT();
  const { colors } = useTheme();
  const showSignInAlert = useIsUnauthenticated();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Reset each tab's nested stack to its root when the tab loses focus,
        // so re-selecting a tab never restores a previously viewed sub-screen.
        popToTopOnBlur: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarButtonTestID: "tab.today",
          title: t("tab_today"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          tabBarButtonTestID: "tab.bible",
          title: t("tab_bible"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarButtonTestID: "tab.calendar",
          title: t("tab_calendar"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          tabBarButtonTestID: "tab.checklist",
          title: t("tab_checklist"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          tabBarButtonTestID: "tab.notes",
          title: t("notes_tab_title"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarButtonTestID: "tab.settings",
          title: t("settings_tab_title"),
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="settings-outline" color={color} size={size} />
              {showSignInAlert && <AttentionDot />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
