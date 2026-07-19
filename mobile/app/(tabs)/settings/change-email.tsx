import { mapFormErrors } from "@/src/api/apiError";
import { beginEmailChange } from "@/src/api/authApi";
import { useAuth } from "@/src/stores/auth";
import { useT } from "@/src/i18n/LocaleProvider";
import { translateApiError } from "@/src/i18n/translateApiError";
import { spacing } from "@/src/design";
import { AuthCodeForm, Button, Card, InputField, Screen, Text } from "@/src/components";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function ChangeEmail() {
  const t = useT();
  const { state: authState } = useAuth();

  const [step, setStep] = useState<"form" | "code">("form");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newEmailError, setNewEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authState.status !== "authenticated") {
    return (
      <Screen edges={[]}>
        <View style={styles.content}>
          <Card>
            <Text variant="body" color="mutedText">
              {t("auth_not_logged_in")}
            </Text>
          </Card>
        </View>
      </Screen>
    );
  }

  const currentEmail = authState.session.user.email;
  const token = authState.session.token;

  async function onSubmit() {
    if (isSubmitting) return;
    setError(null);
    setNewEmailError(null);
    setPasswordError(null);

    const trimmed = newEmail.trim();
    let hasFieldError = false;
    if (!trimmed) {
      setNewEmailError(t("change_email_new_required"));
      hasFieldError = true;
    }
    if (!password) {
      setPasswordError(t("change_email_password_required"));
      hasFieldError = true;
    }
    if (hasFieldError) return;

    setIsSubmitting(true);
    try {
      const r = await beginEmailChange(token, trimmed, password);
      if (!r.ok) {
        const fieldMap = mapFormErrors(r.error);
        setNewEmailError(fieldMap.newEmail ? translateApiError(t, fieldMap.newEmail) : null);
        setPasswordError(fieldMap.password ? translateApiError(t, fieldMap.password) : null);
        const formMessage = fieldMap._form ? translateApiError(t, fieldMap._form) : null;
        if (formMessage) setError(formMessage);
        else if (!fieldMap.newEmail && !fieldMap.password) setError(t("auth_generic_error"));
        return;
      }
      setStep("code");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === "form" ? (
          <>
            <Text variant="body" color="mutedText" style={styles.hint}>
              {t("change_email_hint")}
            </Text>
            <Text variant="caption" color="mutedText" style={styles.current}>
              {t("change_email_current")} {currentEmail}
            </Text>

            {!!error && (
              <Text variant="bodyStrong" color="destructive" style={styles.error}>
                {error}
              </Text>
            )}

            <View style={styles.form}>
              <InputField
                label={t("change_email_new_label")}
                testID="change-email.new-email"
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!isSubmitting}
                error={newEmailError ?? undefined}
              />
              <InputField
                label={t("change_email_password_label")}
                testID="change-email.password"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                textContentType="password"
                editable={!isSubmitting}
                error={passwordError ?? undefined}
              />
            </View>

            <Button
              label={t("change_email_submit")}
              testID="change-email.submit"
              onPress={onSubmit}
              loading={isSubmitting}
              fullWidth
            />
          </>
        ) : (
          <AuthCodeForm
            flow="change-email"
            email={currentEmail}
            resultEmail={newEmail.trim()}
            onDone={() => router.back()}
            testIDPrefix="change-email.code"
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenH, paddingBottom: spacing.listBottom },
  hint: { marginBottom: spacing.sm },
  current: { marginBottom: spacing.lg },
  error: { marginBottom: spacing.md },
  form: { gap: spacing.lg, marginBottom: spacing.lg },
});
