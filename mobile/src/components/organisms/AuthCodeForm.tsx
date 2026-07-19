import { useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { mapFormErrors } from "@/src/api/apiError";
import {
  completeEmailChange,
  completePasswordReset,
  validatePasswordResetCode,
  verifyEmailCode,
} from "@/src/api/authApi";
import { useAuth } from "@/src/stores/auth";
import { useT } from "@/src/i18n/LocaleProvider";
import { translateApiError } from "@/src/i18n/translateApiError";
import { spacing } from "@/src/design";
import { Button, InputField, Text } from "@/src/components";

const CODE_LENGTH = 6;

export type AuthCodeFlow = "verify-email" | "reset-password" | "change-email";

type Props = {
  flow: AuthCodeFlow;
  /** The account email the code is validated against (current email for change-email). */
  email: string;
  /** Email to store in the resulting session; defaults to `email` (differs for change-email). */
  resultEmail?: string;
  /** Called after the flow completes and the session (if any) is established. */
  onDone: () => void;
  testIDPrefix?: string;
};

/**
 * Reusable "enter the code from your email" form for the verify-email,
 * reset-password, and change-email flows. Mirrors the web AuthCodeModal:
 * auto-submits once a full code is entered, and for reset-password reveals the
 * new-password fields only after the code validates.
 */
export function AuthCodeForm({
  flow,
  email,
  resultEmail,
  onDone,
  testIDPrefix = "auth-code",
}: Props) {
  const t = useT();
  const { establishSession } = useAuth();

  const [code, setCode] = useState("");
  const [step, setStep] = useState<"code" | "password">("code");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const sessionEmail = resultEmail ?? email;

  function showError(payload: { code: string; errors: { field: string | null; code: string }[] }) {
    const mapped = mapFormErrors(payload);
    const detail = mapped._form ?? Object.values(mapped)[0];
    setError((detail && translateApiError(t, detail)) || t("auth_generic_error"));
  }

  async function submitCode(rawCode: string) {
    if (submitting || rawCode.length !== CODE_LENGTH) return;
    setSubmitting(true);
    setError(null);
    try {
      if (flow === "verify-email") {
        const r = await verifyEmailCode(email, rawCode);
        if (!r.ok) return failCode(r.error);
        await establishSession(r.token, sessionEmail);
        onDone();
      } else if (flow === "change-email") {
        const r = await completeEmailChange(email, rawCode);
        if (!r.ok) return failCode(r.error);
        await establishSession(r.token, sessionEmail);
        onDone();
      } else {
        const r = await validatePasswordResetCode(email, rawCode);
        if (!r.ok) return failCode(r.error);
        if (!r.valid) {
          setError(t("auth_code_invalid"));
          setCode("");
          return;
        }
        setStep("password");
        setTimeout(() => passwordRef.current?.focus(), 50);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function failCode(payload: { code: string; errors: { field: string | null; code: string }[] }) {
    showError(payload);
    setCode("");
  }

  function onChangeCode(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH && step === "code") {
      void submitCode(digits);
    }
  }

  async function submitResetComplete() {
    if (submitting) return;
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t("auth_passwords_must_match"));
      return;
    }
    setSubmitting(true);
    try {
      const r = await completePasswordReset(email, code, newPassword);
      if (!r.ok) {
        showError(r.error);
        return;
      }
      await establishSession(r.token, sessionEmail);
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="body" color="mutedText" style={styles.instructions}>
        {t("auth_code_instructions")}
      </Text>
      <Text variant="bodyStrong" style={styles.email}>
        {sessionEmail}
      </Text>

      {!!error && (
        <Text
          variant="bodyStrong"
          color="destructive"
          style={styles.error}
          testID={`${testIDPrefix}.error`}
        >
          {error}
        </Text>
      )}

      {step === "code" ? (
        <InputField
          label={t("auth_code_label")}
          testID={`${testIDPrefix}.code`}
          value={code}
          onChangeText={onChangeCode}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          autoFocus
          editable={!submitting}
        />
      ) : (
        <View style={styles.passwordFields}>
          <InputField
            ref={passwordRef}
            label={t("auth_new_password")}
            testID={`${testIDPrefix}.new-password`}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={!submitting}
          />
          <InputField
            label={t("auth_confirm_new_password")}
            testID={`${testIDPrefix}.confirm-password`}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={!submitting}
            onSubmitEditing={submitResetComplete}
            returnKeyType="go"
          />
        </View>
      )}

      <Button
        label={step === "password" ? t("auth_code_submit") : t("auth_code_continue")}
        testID={`${testIDPrefix}.submit`}
        onPress={() => (step === "password" ? submitResetComplete() : submitCode(code))}
        loading={submitting}
        disabled={step === "code" && code.length !== CODE_LENGTH}
        fullWidth
        style={{ marginTop: spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  instructions: {},
  email: { marginBottom: spacing.sm },
  error: {},
  passwordFields: { gap: spacing.lg },
});
