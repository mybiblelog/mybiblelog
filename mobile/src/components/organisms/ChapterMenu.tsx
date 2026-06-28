import { useT } from "@/src/i18n/LocaleProvider";
import { MenuSheet } from "./MenuSheet";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenInBible: () => void;
  onLogReading: () => void;
};

/** Action menu for a Bible chapter (open in Bible / log reading). */
export function ChapterMenu({ visible, onClose, onOpenInBible, onLogReading }: Props) {
  const t = useT();
  return (
    <MenuSheet
      visible={visible}
      onClose={onClose}
      cancelLabel={t("cancel")}
      actions={[
        { label: t("menu_open_in_bible"), onPress: onOpenInBible },
        { label: t("menu_log_reading"), onPress: onLogReading },
      ]}
    />
  );
}
