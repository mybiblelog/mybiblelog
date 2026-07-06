import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { deleteAccount } from "@/src/api/settingsApi";
import { useAuth } from "@/src/stores/auth";
import { Button, Card, ConfirmDialog, Icon, Screen, Text } from "@/src/components";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { useToast } from "@/src/toast/ToastProvider";

type Acknowledgements = {
  logEntries: boolean;
  notes: boolean;
  permanent: boolean;
};

function Checkbox({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={styles.checkRow}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <Icon
        name={checked ? "checkbox" : "square-outline"}
        size={22}
        color={checked ? "primary" : "mutedText"}
      />
      <Text variant="body" style={styles.checkLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function DeleteAccountScreen() {
  const t = useT();
  const { showToast } = useToast();
  const { state: authState, logout } = useAuth();

  const [ack, setAck] = useState<Acknowledgements>({
    logEntries: false,
    notes: false,
    permanent: false,
  });
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fullyUnderstands = ack.logEntries && ack.notes && ack.permanent;
  const token = authState.status === "authenticated" ? authState.session.token : null;

  async function onConfirmDelete() {
    setConfirmVisible(false);
    if (!token || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      // Clear the local session, then return to the settings root.
      await logout();
      router.replace("/settings");
    } catch {
      setIsDeleting(false);
      showToast({ type: "error", message: t("delete_account_unable") });
    }
  }

  const bullets = [
    t("delete_account_list_account"),
    t("delete_account_list_log_entries"),
    t("delete_account_list_notes"),
    t("delete_account_list_permanent"),
  ];

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodyStrong" style={styles.description}>
          {t("delete_account_description")}
        </Text>

        <View style={styles.bullets}>
          {bullets.map((line, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text variant="body" color="mutedText">
                •
              </Text>
              <Text variant="body" color="mutedText" style={styles.bulletText}>
                {line}
              </Text>
            </View>
          ))}
        </View>

        <Card style={styles.card}>
          <Checkbox
            checked={ack.logEntries}
            label={t("delete_account_understand_log_entries")}
            onToggle={() => setAck((a) => ({ ...a, logEntries: !a.logEntries }))}
          />
          <Checkbox
            checked={ack.notes}
            label={t("delete_account_understand_notes")}
            onToggle={() => setAck((a) => ({ ...a, notes: !a.notes }))}
          />
          <Checkbox
            checked={ack.permanent}
            label={t("delete_account_understand_permanent")}
            onToggle={() => setAck((a) => ({ ...a, permanent: !a.permanent }))}
          />
        </Card>

        <Button
          label={t("delete_account_confirm_button")}
          variant="destructive"
          fullWidth
          loading={isDeleting}
          disabled={!fullyUnderstands || isDeleting}
          onPress={() => setConfirmVisible(true)}
        />

        <ConfirmDialog
          visible={confirmVisible}
          title={t("delete_account_confirm_title")}
          message={t("delete_account_confirm_message")}
          confirmLabel={t("delete_account_confirm_button")}
          cancelLabel={t("cancel")}
          onConfirm={onConfirmDelete}
          onCancel={() => setConfirmVisible(false)}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenH,
    paddingBottom: spacing.listBottom,
  },
  description: { marginBottom: spacing.lg },
  bullets: { marginBottom: spacing.xl, gap: spacing.sm },
  bulletRow: { flexDirection: "row", gap: spacing.sm },
  bulletText: { flex: 1 },
  card: { gap: spacing.xs, marginBottom: spacing.xl },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkLabel: { flex: 1 },
});
