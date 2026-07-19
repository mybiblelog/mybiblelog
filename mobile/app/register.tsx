import { mapFormErrors } from "@/src/api/apiError";
import { register } from "@/src/api/authApi";
import { useAuth } from "@/src/stores/auth";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { translateApiError } from "@/src/i18n/translateApiError";
import { spacing, useTheme } from "@/src/design";
import { AuthCodeForm, Button, InputField, Text } from "@/src/components";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

export default function Register() {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const { loginWithEmailPassword } = useAuth();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function goHome() {
    router.replace("/");
  }

  async function onRegister() {
    if (isSubmitting) return;
    setError(null);
    setEmailError(null);
    setPasswordError(null);

    const trimmedEmail = email.trim();
    let hasFieldError = false;
    if (!trimmedEmail) {
      setEmailError(t("auth_email_required"));
      hasFieldError = true;
    }
    if (!password) {
      setPasswordError(t("auth_password_required"));
      hasFieldError = true;
    }
    if (hasFieldError) return;

    setIsSubmitting(true);
    try {
      const reg = await register(trimmedEmail, password, locale);
      if (!reg.ok) {
        const fieldMap = mapFormErrors(reg.error);
        setEmailError(fieldMap.email ? translateApiError(t, fieldMap.email) : null);
        setPasswordError(fieldMap.password ? translateApiError(t, fieldMap.password) : null);
        const formMessage = fieldMap._form ? translateApiError(t, fieldMap._form) : null;
        if (formMessage) setError(formMessage);
        else if (!fieldMap.email && !fieldMap.password) setError(t("auth_generic_error"));
        return;
      }

      // Verification may be off server-side: try logging straight in. When it's
      // required, login fails with `verify_email` and we show the code step.
      const login = await loginWithEmailPassword(trimmedEmail, password);
      if (login.ok) {
        goHome();
        return;
      }
      if (mapFormErrors(login.error)._form?.code === "verify_email") {
        setStep("verify");
        return;
      }
      setError(t("auth_generic_error"));
    } catch {
      setError(t("auth_generic_error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="title" style={styles.title}>
          {t("register_title")}
        </Text>

        {step === "form" ? (
          <>
            <Text variant="body" color="mutedText" style={styles.subtitle}>
              {t("register_hint")}
            </Text>

            {!!error && (
              <Text variant="bodyStrong" color="destructive" style={styles.error}>
                {error}
              </Text>
            )}

            <View style={styles.form}>
              <InputField
                label={t("auth_email")}
                testID="register.email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!isSubmitting}
                error={emailError ?? undefined}
              />
              <InputField
                label={t("auth_password")}
                testID="register.password"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                textContentType="newPassword"
                editable={!isSubmitting}
                onSubmitEditing={onRegister}
                returnKeyType="go"
                error={passwordError ?? undefined}
              />
            </View>

            <Button
              label={t("register_submit")}
              testID="register.submit"
              onPress={onRegister}
              loading={isSubmitting}
              fullWidth
            />

            <Button
              label={t("register_have_account")}
              variant="ghost"
              onPress={() => router.replace("/login")}
              style={styles.secondaryButton}
            />
          </>
        ) : (
          <AuthCodeForm
            flow="verify-email"
            email={email.trim()}
            onDone={goHome}
            testIDPrefix="register.code"
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
  error: { marginBottom: spacing.md },
  form: { gap: spacing.lg, marginBottom: spacing.lg },
  secondaryButton: { marginTop: spacing.md },
});
