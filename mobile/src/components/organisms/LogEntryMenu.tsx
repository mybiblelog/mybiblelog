import { useT } from "@/src/i18n/LocaleProvider";
import { MenuSheet, type MenuAction } from "./MenuSheet";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  onOpenInBible?: () => void;
  /** Omitted when there is no following passage (final verse of Revelation). */
  onContinueReading?: () => void;
  onTakeNote: () => void;
  onViewNotes: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** Context menu for a single log entry (open in Bible / continue reading / take note / view notes / edit / delete). */
export function LogEntryMenu({
  visible,
  onClose,
  title,
  onOpenInBible,
  onContinueReading,
  onTakeNote,
  onViewNotes,
  onEdit,
  onDelete,
}: Props) {
  const t = useT();
  const actions: MenuAction[] = [];
  if (onOpenInBible) {
    actions.push({ label: t("menu_open_in_bible"), icon: "book-outline", onPress: onOpenInBible });
  }
  if (onContinueReading) {
    actions.push({
      label: t("menu_continue_reading"),
      icon: "arrow-forward-outline",
      onPress: onContinueReading,
    });
  }
  actions.push({ label: t("menu_take_note"), icon: "create-outline", onPress: onTakeNote });
  actions.push({ label: t("menu_view_notes"), icon: "list-outline", onPress: onViewNotes });
  actions.push({ label: t("menu_edit"), icon: "pencil-outline", onPress: onEdit });
  actions.push({
    label: t("menu_delete"),
    icon: "trash-outline",
    onPress: onDelete,
  });

  return (
    <MenuSheet
      visible={visible}
      onClose={onClose}
      title={title}
      actions={actions}
      cancelLabel={t("cancel")}
    />
  );
}
