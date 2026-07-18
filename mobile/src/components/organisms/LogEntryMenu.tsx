import { useT } from "@/src/i18n/LocaleProvider";
import { MenuSheet, type MenuAction } from "./MenuSheet";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenInBible?: () => void;
  /** Omitted when there is no following passage (final verse of Revelation). */
  onContinueReading?: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** Context menu for a single log entry (open in Bible / continue reading / edit / delete). */
export function LogEntryMenu({
  visible,
  onClose,
  onOpenInBible,
  onContinueReading,
  onEdit,
  onDelete,
}: Props) {
  const t = useT();
  const actions: MenuAction[] = [];
  if (onOpenInBible) {
    actions.push({ label: t("menu_open_in_bible"), onPress: onOpenInBible });
  }
  if (onContinueReading) {
    actions.push({ label: t("menu_continue_reading"), onPress: onContinueReading });
  }
  actions.push({ label: t("menu_edit"), onPress: onEdit });
  actions.push({ label: t("menu_delete"), onPress: onDelete, color: "destructive" });

  return (
    <MenuSheet visible={visible} onClose={onClose} actions={actions} cancelLabel={t("cancel")} />
  );
}
