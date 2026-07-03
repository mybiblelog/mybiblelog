import { Bible, displayTimeSince } from "@mybiblelog/shared";
import { StyleSheet, View } from "react-native";
import type { PassageNote } from "@/src/api/notesApi";
import { spacing } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useTagsList } from "@/src/stores/passageNoteTags";
import { IconButton } from "../atoms/IconButton";
import { TagPill } from "../atoms/TagPill";
import { Text } from "../atoms/Text";
import { Card } from "../molecules/Card";

type Props = {
  note: PassageNote;
  onPressMenu: (note: PassageNote) => void;
};

/** A note in the list (web `PassageNote.vue` equivalent). */
export function NoteCard({ note, onPressMenu }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const tags = useTagsList();

  const noteTags = note.tags
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined);

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerText}>
          {note.passages.length > 0 ? (
            <View style={styles.passageRow}>
              {note.passages.map((passage, index) => (
                <Text
                  key={`${passage.startVerseId}-${passage.endVerseId}-${index}`}
                  variant="bodyStrong"
                  color="primary"
                >
                  {Bible.displayVerseRange(passage.startVerseId, passage.endVerseId, locale)}
                </Text>
              ))}
            </View>
          ) : null}
          {note.createdAt ? (
            <Text variant="caption" color="mutedText">
              {displayTimeSince(note.createdAt, locale)}
            </Text>
          ) : null}
        </View>
        <IconButton
          name="ellipsis-horizontal"
          accessibilityLabel={t("note_actions")}
          onPress={() => onPressMenu(note)}
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
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerText: { flex: 1, gap: 2 },
  passageRow: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing.md },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
