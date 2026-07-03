import { mapFormErrors } from "@/src/api/apiError";
import { useAuth } from "@/src/stores/auth";
import { signInWithGoogle } from "@/src/auth/googleSignIn";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { translateApiError } from "@/src/i18n/translateApiError";
import { spacing, useTheme } from "@/src/design";
import { Button, InputField, Text } from "@/src/components";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

export default function Login() {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const { state: authState, finishGoogleLogin, loginWithEmailPassword } = useAuth();
  const lastEmail =
    authState.status === "unauthenticated" ? (authState.lastLoggedInEmail ?? null) : null;

  const [email, setEmail] = useState(lastEmail ?? "");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onEmailLogin() {
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
      const result = await loginWithEmailPassword(trimmedEmail, password);
      setIsSubmitting(false);
      if (result.ok) {
        // Deep links can land here with no back stack.
        if (router.canGoBack()) router.back();
        else router.replace("/");
        return;
      }

      // Mirror the web app: surface top-level (_form) and field-level errors from
      // the API. Only fall back to a generic message if nothing is translatable.
      const fieldMap = mapFormErrors(result.error);
      const formMessage = fieldMap._form ? translateApiError(t, fieldMap._form) : null;
      const emailMessage = fieldMap.email ? translateApiError(t, fieldMap.email) : null;
      const passwordMessage = fieldMap.password ? translateApiError(t, fieldMap.password) : null;

      setEmailError(emailMessage);
      setPasswordError(passwordMessage);
      if (formMessage) {
        setError(formMessage);
      } else if (!emailMessage && !passwordMessage) {
        setError(t("auth_generic_error"));
      }
    } catch {
      setIsSubmitting(false);
      setError(t("auth_generic_error"));
    }
  }

  async function onGoogleLogin() {
    if (isSubmitting) return;
    setError(null);
    setEmailError(null);
    setPasswordError(null);
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      if (result.ok === "cancelled") {
        // User dismissed the Google sheet — stay quiet, no error.
        setIsSubmitting(false);
        return;
      }
      if (!result.ok) {
        setIsSubmitting(false);
        setError(t("auth_generic_error"));
        return;
      }

      const login = await finishGoogleLogin(result.idToken, locale);
      setIsSubmitting(false);
      if (login.ok) {
        if (router.canGoBack()) router.back();
        else router.replace("/");
        return;
      }
      setError(t("auth_generic_error"));
    } catch {
      setIsSubmitting(false);
      setError(t("auth_generic_error"));
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="title" style={styles.title}>
          {t("login_title")}
        </Text>
        <Text variant="body" color="mutedText" style={styles.subtitle}>
          {lastEmail ? t("login_sign_in_again_as", { email: lastEmail }) : t("auth_login_hint")}
        </Text>

        {!!error && (
          <Text variant="bodyStrong" color="destructive" style={styles.error}>
            {error}
          </Text>
        )}

        <View style={styles.form}>
          <InputField
            label={t("auth_email")}
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
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            secureTextEntry
            textContentType="password"
            editable={!isSubmitting}
            onSubmitEditing={onEmailLogin}
            returnKeyType="go"
            error={passwordError ?? undefined}
          />
        </View>

        <Button
          label={t("login_with_email")}
          onPress={onEmailLogin}
          loading={isSubmitting}
          fullWidth
        />

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text variant="caption" color="mutedText" style={styles.dividerText}>
            {t("login_divider_or")}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Button
          label={t("login_with_google")}
          variant="secondary"
          onPress={onGoogleLogin}
          disabled={isSubmitting}
          fullWidth
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenH,
    justifyContent: "center",
  },
  title: { marginBottom: spacing.sm },
  subtitle: { marginBottom: spacing.lg },
  error: { marginBottom: spacing.md },
  form: { gap: spacing.lg, marginBottom: spacing.lg },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { marginHorizontal: spacing.lg },
});
