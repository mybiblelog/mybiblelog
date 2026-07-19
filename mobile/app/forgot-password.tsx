import { beginPasswordReset } from "@/src/api/authApi";
import { useT } from "@/src/i18n/LocaleProvider";
import { spacing, useTheme } from "@/src/design";
import { AuthCodeForm, Button, InputField, Text } from "@/src/components";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

export default function ForgotPassword() {
  const t = useT();
  const { colors } = useTheme();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedEmail = email.trim();

  async function onSend() {
    if (isSubmitting) return;
    setEmailError(null);
    if (!trimmedEmail) {
      setEmailError(t("auth_email_required"));
      return;
    }
    setIsSubmitting(true);
    try {
      // The API always reports success (anti-enumeration); we advance regardless.
      await beginPasswordReset(trimmedEmail);
      setStep("code");
    } finally {
      setIsSubmitting(false);
    }
  }

  function goHome() {
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="title" style={styles.title}>
          {t("forgot_password_title")}
        </Text>

        {step === "email" ? (
          <>
            <Text variant="body" color="mutedText" style={styles.subtitle}>
              {t("forgot_password_hint")}
            </Text>
            <View style={styles.form}>
              <InputField
                label={t("auth_email")}
                testID="forgot-password.email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!isSubmitting}
                onSubmitEditing={onSend}
                returnKeyType="go"
                error={emailError ?? undefined}
              />
            </View>
            <Button
              label={t("forgot_password_submit")}
              testID="forgot-password.submit"
              onPress={onSend}
              loading={isSubmitting}
              fullWidth
            />
          </>
        ) : (
          <AuthCodeForm
            flow="reset-password"
            email={trimmedEmail}
            onDone={goHome}
            testIDPrefix="forgot-password.code"
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: spacing.screenH, justifyContent: "center" },
  title: { marginBottom: spacing.sm },
  subtitle: { marginBottom: spacing.lg },
  form: { gap: spacing.lg, marginBottom: spacing.lg },
});
