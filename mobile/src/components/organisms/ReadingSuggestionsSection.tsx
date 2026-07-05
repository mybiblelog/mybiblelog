import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { openPassageInBible } from "@/src/bible/openInBible";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import type { DisplayReadingSuggestion } from "@/src/reading-suggestions/useReadingSuggestions";
import { logEntryActions } from "@/src/stores/logEntries";
import { useSettingsValue } from "@/src/stores/userSettings";
import { useToast } from "@/src/toast/ToastProvider";
import { IconButton } from "../atoms/IconButton";
import { Text } from "../atoms/Text";
import { ListItem } from "../molecules/ListItem";
import { LogEntryEditorModal } from "./LogEntryEditorModal";
import { MenuSheet } from "./MenuSheet";

type Props = {
  suggestions: DisplayReadingSuggestion[];
  /** Date (YYYY-MM-DD) preset when logging a suggestion from Today. */
  today: string;
};

/**
 * The Today screen's "Reading Suggestions" section (web `today.vue`
 * equivalent): up to three suggested passages, each with Open Bible and
 * Log Reading actions.
 */
export function ReadingSuggestionsSection({ suggestions, today }: Props) {
  const t = useT();
  const settings = useSettingsValue();
  const { showToast } = useToast();

  const [menuSuggestion, setMenuSuggestion] = useState<DisplayReadingSuggestion | null>(null);
  const [loggingSuggestion, setLoggingSuggestion] = useState<DisplayReadingSuggestion | null>(null);

  const handleOpenInBible = (suggestion: DisplayReadingSuggestion) => {
    void (async () => {
      const ok = await openPassageInBible(suggestion.startVerseId, {
        preferredBibleApp: settings?.preferredBibleApp,
        preferredBibleVersion: settings?.preferredBibleVersion,
      });
      if (!ok) {
        showToast({ type: "error", message: t("calendar_open_bible_failed") });
      }
    })();
  };

  return (
    <View style={styles.section}>
      <Text variant="label" style={styles.sectionTitle}>
        {t("today_reading_suggestions")}
      </Text>

      {suggestions.length === 0 ? (
        <Text variant="body" color="mutedText">
          {t("today_no_suggestions")}
        </Text>
      ) : (
        <View style={styles.list}>
          {suggestions.map((suggestion) => (
            <ListItem
              key={`${suggestion.startVerseId}-${suggestion.endVerseId}`}
              title={suggestion.passageLabel}
              subtitle={suggestion.contextMessage}
              meta={t("today_suggestion_meta", { count: suggestion.newVerseCount })}
              onPress={() => setMenuSuggestion(suggestion)}
              trailing={
                <IconButton
                  name="ellipsis-horizontal"
                  accessibilityLabel={t("today_reading_suggestions")}
                  onPress={() => setMenuSuggestion(suggestion)}
                />
              }
            />
          ))}
        </View>
      )}

      <MenuSheet
        visible={menuSuggestion !== null}
        onClose={() => setMenuSuggestion(null)}
        cancelLabel={t("cancel")}
        actions={[
          {
            label: t("menu_open_in_bible"),
            onPress: () => {
              if (menuSuggestion) handleOpenInBible(menuSuggestion);
            },
          },
          {
            label: t("menu_log_reading"),
            onPress: () => setLoggingSuggestion(menuSuggestion),
          },
        ]}
      />

      <LogEntryEditorModal
        visible={loggingSuggestion !== null}
        onClose={() => setLoggingSuggestion(null)}
        title={t("add_log_entry_title")}
        submitLabel={t("save")}
        initialEntry={
          loggingSuggestion
            ? {
                date: today,
                startVerseId: loggingSuggestion.startVerseId,
                endVerseId: loggingSuggestion.endVerseId,
              }
            : undefined
        }
        onSubmit={(entry) => {
          void logEntryActions.createEntry(entry);
          setLoggingSuggestion(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  sectionTitle: { marginBottom: spacing.md },
  list: { gap: spacing.md },
});
