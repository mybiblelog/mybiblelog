import { useEffect, useRef, useState } from "react";
import { useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenInBible: () => void;
  onLogReading: () => void;
};

export function ChapterMenu({ visible, onClose, onOpenInBible, onLogReading }: Props) {
  const t = useT();
  const { colors } = useTheme();
  const [isRendered, setIsRendered] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(40);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 180,
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
          duration: 120,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 40,
          duration: 140,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setIsRendered(false);
      });
    }
  }, [backdropOpacity, isRendered, sheetTranslateY, visible]);

  return (
    <Modal
      visible={isRendered}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropOpacity, backgroundColor: colors.backdrop },
          ]}
        >
          <Pressable style={styles.backdropPressTarget} onPress={onClose} />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: sheetTranslateY }] }}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Pressable
              style={styles.item}
              onPress={() => {
                onClose();
                onOpenInBible();
              }}
            >
              <Text style={[styles.itemText, { color: colors.text }]}>
                {t("menu_open_in_bible")}
              </Text>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable
              style={styles.item}
              onPress={() => {
                onClose();
                onLogReading();
              }}
            >
              <Text style={[styles.itemText, { color: colors.text }]}>
                {t("menu_log_reading")}
              </Text>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.item} onPress={onClose}>
              <Text style={[styles.itemText, { color: colors.text }]}>
                {t("cancel")}
              </Text>
            </Pressable>
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
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropPressTarget: {
    flex: 1,
  },
  sheet: {
    borderRadius: 16,
    overflow: "hidden",
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemText: {
    fontSize: 17,
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});

