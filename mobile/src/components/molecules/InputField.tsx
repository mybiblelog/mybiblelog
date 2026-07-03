import { forwardRef, useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { radius, spacing, TOUCH_TARGET, useTheme } from "@/src/design";
import { Text } from "../atoms/Text";

export type InputFieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

/** Labeled text input with focus + error states keyed to design tokens. */
export const InputField = forwardRef<TextInput, InputFieldProps>(function InputField(
  { label, error, style, onFocus, onBlur, ...rest },
  ref
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.destructive : focused ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      {!!label && (
        <Text variant="label" color="mutedText">
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor },
          style,
        ]}
        {...rest}
      />
      {!!error && (
        <Text variant="caption" color="destructive">
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  input: {
    minHeight: TOUCH_TARGET,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: "600",
  },
});
