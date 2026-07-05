import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  TAG_DESCRIPTION_MAX_LENGTH,
  TAG_LABEL_MAX_LENGTH,
  type PassageNoteTag,
} from "@/src/api/tagsApi";
import { radius, spacing, TOUCH_TARGET, useTheme } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { TAG_COLOR_PALETTE } from "@/src/notes/tagColors";
import { normalizeHexColor } from "@/src/notes/tagSort";
import { tagActions } from "@/src/stores/passageNoteTags";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";
import { InputField } from "../molecules/InputField";
import { BottomSheet } from "./BottomSheet";

type Props = {
  visible: boolean;
  /** Edit this tag; omit to create a new one. */
  initialTag?: PassageNoteTag | null;
  onClose: () => void;
  /** Called with the saved tag after a successful create/update. */
  onSaved?: (tag: PassageNoteTag) => void;
};

const DEFAULT_COLOR = TAG_COLOR_PALETTE[0];

/** Create/edit a tag: label, preset color swatches, description. */
export function TagEditorSheet({ visible, initialTag, onClose, onSaved }: Props) {
  const t = useT();
  const { colors } = useTheme();
  const wasVisible = useRef(false);

  const [label, setLabel] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setLabel(initialTag?.label ?? "");
      setColor(normalizeHexColor(initialTag?.color) ?? DEFAULT_COLOR);
      setDescription(initialTag?.description ?? "");
      setSaving(false);
      setError(null);
    }
    wasVisible.current = visible;
  }, [visible, initialTag]);

  // Tags created on the web can use any color; keep an off-palette color
  // choosable so editing never silently changes it.
  const palette = useMemo(() => {
    const extra =
      normalizeHexColor(initialTag?.color) !== null &&
      !TAG_COLOR_PALETTE.includes(normalizeHexColor(initialTag?.color) as never)
        ? [normalizeHexColor(initialTag?.color) as string]
        : [];
    return [...extra, ...TAG_COLOR_PALETTE];
  }, [initialTag]);

  const canSave = label.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const input = { label: label.trim(), color, description };
    const saved = initialTag
      ? await tagActions.update({ ...input, id: initialTag.id })
      : await tagActions.create(input);
    setSaving(false);
    if (!saved) {
      setError(t("tag_could_not_save"));
      return;
    }
    onSaved?.(saved);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} swipeToDismiss={false}>
      <View style={styles.header}>
        <Text variant="heading" style={styles.headerTitle}>
          {initialTag ? t("tag_editor_edit") : t("tag_editor_new")}
        </Text>
        <Button
          label={t("save")}
          testID="tag-editor.save"
          size="sm"
          onPress={handleSave}
          disabled={!canSave}
          loading={saving}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <InputField
          label={t("tag_label")}
          testID="tag-editor.label"
          value={label}
          onChangeText={setLabel}
          maxLength={TAG_LABEL_MAX_LENGTH}
          placeholder={t("tag_label_placeholder")}
        />

        <View style={styles.colorSection}>
          <Text variant="label" color="mutedText">
            {t("tag_color")}
          </Text>
          <View style={styles.swatchGrid}>
            {palette.map((swatch) => {
              const selected = swatch === color;
              return (
                <AnimatedPressable
                  key={swatch}
                  accessibilityRole="button"
                  accessibilityLabel={swatch}
                  accessibilityState={{ selected }}
                  onPress={() => setColor(swatch)}
                  style={[
                    styles.swatch,
                    { backgroundColor: swatch, borderColor: colors.border },
                    selected && { borderColor: colors.primary, borderWidth: 3 },
                  ]}
                >
                  {selected ? <Icon name="checkmark" size={18} color="onPrimary" /> : null}
                </AnimatedPressable>
              );
            })}
          </View>
          <Text variant="caption" color="mutedText">
            {color}
          </Text>
        </View>

        <InputField
          label={t("tag_description")}
          value={description}
          onChangeText={setDescription}
          maxLength={TAG_DESCRIPTION_MAX_LENGTH}
          placeholder={t("tag_description_placeholder")}
          multiline
          numberOfLines={3}
          style={styles.descriptionInput}
        />

        {error ? (
          <Text variant="caption" color="destructive">
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t("cancel")} variant="secondary" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: { flex: 1 },
  scroll: { maxHeight: 440 },
  form: { gap: spacing.lg },
  colorSection: { gap: spacing.sm },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  swatch: {
    width: TOUCH_TARGET - 6,
    height: TOUCH_TARGET - 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  descriptionInput: { minHeight: 72, textAlignVertical: "top" },
  footer: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
