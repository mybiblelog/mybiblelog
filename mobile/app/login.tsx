import { mapFormErrors } from "@/src/api/apiError";
import { useAuth } from "@/src/auth/AuthProvider";
import { signInWithGoogle } from "@/src/auth/googleSignIn";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { translateApiError } from "@/src/i18n/translateApiError";
import { useTheme } from "@/src/theme/ThemeProvider";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Login() {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const { state: authState, finishGoogleLogin, loginWithEmailPassword } = useAuth();
  const lastEmail =
    authState.status === "unauthenticated" ? authState.lastLoggedInEmail ?? null : null;

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
        router.back();
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
        router.back();
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
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>{t("login_title")}</Text>
        {lastEmail ? (
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            {t("login_sign_in_again_as", { email: lastEmail })}
          </Text>
        ) : (
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            {t("auth_login_hint")}
          </Text>
        )}

        {!!error && (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        )}

        <Text style={[styles.label, { color: colors.text }]}>{t("auth_email")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={!isSubmitting}
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            { borderColor: emailError ? colors.destructive : colors.border, color: colors.text },
          ]}
        />
        {!!emailError && (
          <Text style={[styles.fieldError, { color: colors.destructive }]}>{emailError}</Text>
        )}

        <Text style={[styles.label, { color: colors.text }]}>{t("auth_password")}</Text>
        <TextInput
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
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            { borderColor: passwordError ? colors.destructive : colors.border, color: colors.text },
          ]}
        />
        {!!passwordError && (
          <Text style={[styles.fieldError, { color: colors.destructive }]}>{passwordError}</Text>
        )}

        <Pressable
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            isSubmitting && { opacity: 0.65 },
          ]}
          disabled={isSubmitting}
          onPress={onEmailLogin}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              {t("login_with_email")}
            </Text>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedText }]}>
            {t("login_divider_or")}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <Pressable
          style={[
            styles.button,
            styles.googleButton,
            { borderColor: colors.border },
            isSubmitting && { opacity: 0.65 },
          ]}
          disabled={isSubmitting}
          onPress={onGoogleLogin}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {t("login_with_google")}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 14,
  },
  error: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  fieldError: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  googleButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
});
