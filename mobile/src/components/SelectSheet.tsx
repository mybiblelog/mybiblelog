import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type Props<T extends string | number> = {
  visible: boolean;
  title: string;
  options: SelectOption<T>[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
};

export function SelectSheet<T extends string | number>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: Props<T>) {
  const { colors } = useTheme();
  const [isRendered, setIsRendered] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(40)).current;

  const data = useMemo(() => options, [options]);

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
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

            <FlatList
              data={data}
              keyExtractor={(item) => String(item.value)}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const selected = selectedValue === item.value;
                return (
                  <Pressable
                    style={[
                      styles.item,
                      { borderColor: colors.border },
                      selected && { backgroundColor: colors.surfaceAlt },
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      onClose();
                    }}
                  >
                    <Text style={[styles.itemText, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.check, { color: colors.text }]}>
                      {selected ? "✓" : ""}
                    </Text>
                  </Pressable>
                );
              }}
            />
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
  title: {
    fontSize: 18,
    fontWeight: "800",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    paddingBottom: 8,
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "700",
  },
  check: {
    width: 24,
    textAlign: "right",
    fontSize: 18,
    fontWeight: "900",
    opacity: 0.9,
  },
});

