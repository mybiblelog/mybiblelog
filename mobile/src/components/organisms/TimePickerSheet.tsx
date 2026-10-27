import DateTimePicker from "@react-native-community/datetimepicker";
import { StyleSheet, View } from "react-native";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { Button } from "../atoms/Button";
import { BottomSheet } from "./BottomSheet";

type Props = {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
};

/**
 * iOS-only spinner time picker hosted in a BottomSheet, mirroring
 * `DatePickerSheet` (iOS has no native modal for the inline picker, so it needs
 * a surface to live in plus an explicit "Done" to close). On Android callers
 * must use `DateTimePickerAndroid.open()` instead — rendering this there stacks
 * the sheet on top of the native dialog.
 */
export function TimePickerSheet({ visible, value, onChange, onClose }: Props) {
  const t = useT();
  return (
    <BottomSheet visible={visible} onClose={onClose} variant="center">
      <View style={styles.picker}>
        <DateTimePicker
          mode="time"
          display="spinner"
          value={value}
          onValueChange={(_event, date) => onChange(date)}
        />
      </View>
      <Button label={t("date_picker_done")} onPress={onClose} fullWidth />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  picker: { alignItems: "center", marginBottom: spacing.sm },
});
