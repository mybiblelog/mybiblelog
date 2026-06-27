import type { LogEntry } from "@/src/types/log-entry";
import { useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  initialEntry?: LogEntry;
  onClose: () => void;
  onSubmit: (entry: LogEntry) => void;
};

export function AddLogEntryModal({
  visible,
  title,
  submitLabel,
  cancelLabel,
  initialEntry,
  onClose,
  onSubmit,
}: Props) {
  const t = useT();
  const { colors } = useTheme();
  const resolvedTitle = title ?? t("add_log_entry_title");
  const resolvedSubmitLabel = submitLabel ?? t("save");
  const resolvedCancelLabel = cancelLabel ?? t("cancel");
  const [isRendered, setIsRendered] = useState(false);
  const [startVerseIdText, setStartVerseIdText] = useState("");
  const [endVerseIdText, setEndVerseIdText] = useState("");
  const [dateText, setDateText] = useState("");

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(40)).current;

  const canSubmit = useMemo(() => {
    const start = Number(startVerseIdText);
    const end = Number(endVerseIdText);
    return (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start > 0 &&
      end > 0 &&
      end >= start &&
      dateText.trim().length > 0
    );
  }, [dateText, endVerseIdText, startVerseIdText]);

  function resetForm() {
    setStartVerseIdText("");
    setEndVerseIdText("");
    setDateText("");
  }

  useEffect(() => {
    if (visible) {
      if (initialEntry) {
        setStartVerseIdText(String(initialEntry.startVerseId));
        setEndVerseIdText(String(initialEntry.endVerseId));
        setDateText(initialEntry.date);
      } else {
        resetForm();
      }
      setIsRendered(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(40);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (isRendered) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 40,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setIsRendered(false);
      });
    }
  }, [
    backdropOpacity,
    initialEntry,
    isRendered,
    sheetTranslateY,
    visible,
  ]);

  function handleSubmit() {
    const start = Number(startVerseIdText);
    const end = Number(endVerseIdText);
    const date = dateText.trim();

    if (!Number.isFinite(start) || !Number.isFinite(end) || !date) {
      Alert.alert(t("error_invalid_entry_title"), t("error_invalid_entry_message"));
      return;
    }
    if (start <= 0 || end <= 0) {
      Alert.alert(
        t("error_invalid_verses_title"),
        t("error_invalid_verses_message")
      );
      return;
    }
    if (end < start) {
      Alert.alert(
        t("error_invalid_range_title"),
        t("error_invalid_range_message")
      );
      return;
    }

    onSubmit({ startVerseId: start, endVerseId: end, date });
    onClose();
  }

  return (
    <Modal
      visible={isRendered}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={[
            styles.backdrop,
            { opacity: backdropOpacity, backgroundColor: colors.backdrop },
          ]}
        >
          <Pressable style={styles.backdropPressTarget} onPress={onClose} />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: sheetTranslateY }] }}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {resolvedTitle}
            </Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedText }]}>
                {t("start_verse_id_label")}
              </Text>
              <TextInput
                value={startVerseIdText}
                onChangeText={setStartVerseIdText}
                placeholder={t("start_verse_id_placeholder")}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedText }]}>
                {t("end_verse_id_label")}
              </Text>
              <TextInput
                value={endVerseIdText}
                onChangeText={setEndVerseIdText}
                placeholder={t("end_verse_id_placeholder")}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedText }]}>
                {t("date_label")}
              </Text>
              <TextInput
                value={dateText}
                onChangeText={setDateText}
                placeholder={t("date_placeholder")}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.placeholder}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.secondaryButton, { backgroundColor: colors.surfaceAlt }]}
                onPress={onClose}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  {resolvedCancelLabel}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  !canSubmit && styles.primaryButtonDisabled,
                ]}
                disabled={!canSubmit}
                onPress={handleSubmit}
              >
                <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
                  {resolvedSubmitLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropPressTarget: {
    flex: 1,
  },
  sheet: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  primaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "black",
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});

