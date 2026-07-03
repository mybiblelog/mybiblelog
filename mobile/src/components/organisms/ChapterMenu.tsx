import { useT } from "@/src/i18n/LocaleProvider";
import { MenuSheet } from "./MenuSheet";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenInBible: () => void;
  onLogReading: () => void;
  onTakeNote: () => void;
  onViewNotes: () => void;
};

/** Action menu for a Bible chapter (web `ChapterReport` context menu). */
export function ChapterMenu({
  visible,
  onClose,
  onOpenInBible,
  onLogReading,
  onTakeNote,
  onViewNotes,
}: Props) {
  const t = useT();
  return (
    <MenuSheet
      visible={visible}
      onClose={onClose}
      cancelLabel={t("cancel")}
      actions={[
        { label: t("menu_open_in_bible"), onPress: onOpenInBible },
        { label: t("menu_log_reading"), onPress: onLogReading },
        { label: t("menu_take_note"), onPress: onTakeNote },
        { label: t("menu_view_notes"), onPress: onViewNotes },
      ]}
    />
  );
}
