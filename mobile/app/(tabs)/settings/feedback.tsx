import { ApiError, mapFormErrors } from "@/src/api/apiError";
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  type FeedbackKind,
  submitFeedback,
} from "@/src/api/feedbackApi";
import { useAuth } from "@/src/stores/auth";
import { useCanReachServer } from "@/src/stores/connectivity";
import { useT } from "@/src/i18n/LocaleProvider";
import { translateApiError, translateApiErrorCode } from "@/src/i18n/translateApiError";
import { useToast } from "@/src/toast/ToastProvider";
import { spacing } from "@/src/design";
import {
  Button,
  InputField,
  Screen,
  ScreenHeader,
  SelectRow,
  SelectSheet,
  Text,
} from "@/src/components";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function Feedback() {
  const t = useT();
  const { showToast } = useToast();
  const { state: authState } = useAuth();
  const canReachServer = useCanReachServer();

  const signedInEmail = authState.status === "authenticated" ? authState.session.user.email : null;

  const [guestEmail, setGuestEmail] = useState("");
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [kindOpen, setKindOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = signedInEmail ?? guestEmail;
  const kindOptions: { value: FeedbackKind; label: string }[] = [
    { value: "bug", label: t("feedback_kind_bug") },
    { value: "feature", label: t("feedback_kind_feature") },
    { value: "comment", label: t("feedback_kind_comment") },
  ];

  async function onSubmit() {
    if (isSubmitting) return;
    setError(null);
    setEmailError(null);
    setMessageError(null);

    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    let hasFieldError = false;
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError(t("feedback_email_invalid"));
      hasFieldError = true;
    }
    if (!trimmedMessage) {
      setMessageError(t("feedback_message_required"));
      hasFieldError = true;
    }
    if (hasFieldError) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({ email: trimmedEmail, kind, message: trimmedMessage });
      showToast({ type: "success", message: t("feedback_success") });
      setMessage("");
      setKind("bug");
      router.back();
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setError(t("auth_generic_error"));
        return;
      }
      const fieldMap = mapFormErrors({ code: err.code, errors: err.errors });
      const emailDetail = fieldMap.email ? translateApiError(t, fieldMap.email) : null;
      const messageDetail = fieldMap.message ? translateApiError(t, fieldMap.message) : null;
      setEmailError(emailDetail);
      setMessageError(messageDetail);
      const formDetail = fieldMap._form ? translateApiError(t, fieldMap._form) : null;
      if (formDetail) setError(formDetail);
      else if (!emailDetail && !messageDetail) setError(translateApiErrorCode(t, err.code));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader padded back title={t("feedback_title")} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="body" color="mutedText">
          {t("feedback_intro_1")}
        </Text>
        <Text variant="body" color="mutedText" style={styles.intro}>
          {t("feedback_intro_2")}
        </Text>

        {!canReachServer && (
          <Text variant="bodyStrong" color="destructive" style={styles.error}>
            {t("feedback_offline")}
          </Text>
        )}
        {!!error && (
          <Text variant="bodyStrong" color="destructive" style={styles.error}>
            {error}
          </Text>
        )}

        <View style={styles.form}>
          <InputField
            label={t("feedback_email_label")}
            testID="feedback.email"
            value={email}
            onChangeText={setGuestEmail}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!isSubmitting && signedInEmail === null}
            error={emailError ?? undefined}
          />
          <SelectRow
            label={t("feedback_kind_label")}
            value={kindOptions.find((option) => option.value === kind)?.label}
            placeholder={t("settings_select_option")}
            onPress={() => setKindOpen(true)}
            disabled={isSubmitting}
            testID="feedback.kind-select"
          />
          <InputField
            label={t("feedback_message_label")}
            testID="feedback.message"
            value={message}
            onChangeText={setMessage}
            maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
            multiline
            numberOfLines={6}
            style={styles.messageInput}
            editable={!isSubmitting}
            error={messageError ?? undefined}
          />
          <Text variant="caption" color="mutedText" style={styles.charCount}>
            {message.length}/{FEEDBACK_MESSAGE_MAX_LENGTH}
          </Text>
        </View>

        <Button
          label={t("feedback_submit")}
          testID="feedback.submit"
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={!canReachServer}
          fullWidth
        />
      </ScrollView>

      <SelectSheet
        visible={kindOpen}
        title={t("feedback_kind_label")}
        options={kindOptions}
        selectedValue={kind}
        onSelect={setKind}
        onClose={() => setKindOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.pageGutter, paddingBottom: spacing.listBottom },
  intro: { marginTop: spacing.xs, marginBottom: spacing.sm },
  error: { marginBottom: spacing.sm },
  form: { gap: spacing.sm, marginBottom: spacing.sm },
  messageInput: { minHeight: 140, textAlignVertical: "top" },
  charCount: { textAlign: "right", marginTop: -spacing.sm },
});
