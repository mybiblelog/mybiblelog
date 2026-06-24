import { useAuth } from "@/src/auth/AuthProvider";
import { signInWithGoogle } from "@/src/auth/googleSignIn";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Login() {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const { state: authState, finishGoogleLogin } = useAuth();
  const lastEmail =
    authState.status === "unauthenticated" ? authState.lastLoggedInEmail ?? null : null;

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onGoogleLogin() {
    if (isSubmitting) return;
    setError(null);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

      {!!error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}

      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          isSubmitting && { opacity: 0.65 },
        ]}
        disabled={isSubmitting}
        onPress={onGoogleLogin}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {t("login_with_google")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
