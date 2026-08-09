import { Bible, displayTimeSince } from "@mybiblelog/shared";
import { Pressable, StyleSheet, View } from "react-native";
import type { PassageNote } from "@/src/api/notesApi";
import { openPassageInBible } from "@/src/bible/openInBible";
import { spacing } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useTagsList } from "@/src/stores/passageNoteTags";
import { useSettingsValue } from "@/src/stores/userSettings";
import { useToast } from "@/src/toast/ToastProvider";
import { IconButton } from "../atoms/IconButton";
import { TagPill } from "../atoms/TagPill";
import { Text } from "../atoms/Text";
import { Card } from "../molecules/Card";

type Props = {
  note: PassageNote;
  onPressMenu: (note: PassageNote) => void;
  testID?: string;
};

/** A note in the list (web `PassageNote.vue` equivalent). */
export function NoteCard({ note, onPressMenu, testID }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const tags = useTagsList();
  const settings = useSettingsValue();
  const { showToast } = useToast();

  const noteTags = note.tags
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined);

  // The API stamps `updatedAt` on create and bumps it on every edit; `createdAt`
  // covers notes stored before it existed.
  const editedAt = note.updatedAt ?? note.createdAt;

  const handleOpenPassage = (startVerseId: number, endVerseId: number) => {
    void (async () => {
      const ok = await openPassageInBible(startVerseId, endVerseId, {
        preferredBibleApp: settings?.preferredBibleApp,
        preferredBibleVersion: settings?.preferredBibleVersion,
      });
      if (!ok) {
        showToast({ type: "error", message: t("calendar_open_bible_failed") });
      }
    })();
  };

  return (
    // "list-item" padding, so a note sits in the same column as the log-entry
    // rows it shares the Today screen with.
    <Card padding="list-item" testID={testID}>
      <View style={styles.header}>
        {note.passages.length > 0 ? (
          <View style={styles.passageList}>
            {note.passages.map((passage, index) => {
              const label = Bible.displayVerseRange(
                passage.startVerseId,
                passage.endVerseId,
                locale
              );
              return (
                <Pressable
                  key={`${passage.startVerseId}-${passage.endVerseId}-${index}`}
                  accessibilityRole="link"
                  accessibilityLabel={label}
                  onPress={() => handleOpenPassage(passage.startVerseId, passage.endVerseId)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text variant="bodyStrong" color="primary">
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <IconButton
          name="ellipsis-vertical"
          size={18}
          accessibilityLabel={t("note_actions")}
          onPress={() => onPressMenu(note)}
          style={styles.menuButton}
        />
      </View>

      {note.content ? <Text variant="body">{note.content}</Text> : null}

      {noteTags.length > 0 ? (
        <View style={styles.pillRow}>
          {noteTags.map((tag) => (
            <TagPill key={tag.id} label={tag.label} color={tag.color} size="sm" />
          ))}
        </View>
      ) : null}

      {editedAt ? (
        <Text variant="caption" color="mutedText" style={styles.editedAt}>
          {displayTimeSince(editedAt, locale)}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  // One passage per line: a wrapping row let two short references share a line,
  // which read as a single run-on reference.
  passageList: { flex: 1, alignItems: "flex-start", rowGap: spacing["3xs"] },
  // Pins the menu to the right edge even when there is no passage list beside
  // it to take up the slack. The spacing-token rule matches every margin
  // literal; "auto" is a keyword, not a raw spacing value.
  // eslint-disable-next-line no-restricted-syntax
  menuButton: { marginLeft: "auto" },
  pressed: { opacity: 0.7 },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  editedAt: { alignSelf: "flex-end", marginTop: spacing.xs },
});
