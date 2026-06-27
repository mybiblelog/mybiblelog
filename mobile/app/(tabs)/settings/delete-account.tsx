import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { deleteAccount } from "@/src/api/settingsApi";
import { useAuth } from "@/src/auth/AuthProvider";
import { ConfirmDialog } from "@/src/components/ConfirmDialog";
import { useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
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
  const { colors } = useTheme();
  return (
    <Pressable style={styles.checkRow} onPress={onToggle}>
      <Ionicons
        name={checked ? "checkbox" : "square-outline"}
        size={22}
        color={checked ? colors.primary : colors.mutedText}
      />
      <Text style={[styles.checkLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export default function DeleteAccountScreen() {
  const t = useT();
  const { colors } = useTheme();
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
  const token =
    authState.status === "authenticated" ? authState.session.token : null;

  async function onConfirmDelete() {
    setConfirmVisible(false);
    if (!token || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteAccount(token);
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.description, { color: colors.text }]}>
        {t("delete_account_description")}
      </Text>

      <View style={styles.bullets}>
        {bullets.map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={[styles.bulletDot, { color: colors.mutedText }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.mutedText }]}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
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
      </View>

      <Pressable
        style={[
          styles.deleteButton,
          { backgroundColor: colors.destructive },
          (!fullyUnderstands || isDeleting) && { opacity: 0.5 },
        ]}
        disabled={!fullyUnderstands || isDeleting}
        onPress={() => setConfirmVisible(true)}
      >
        {isDeleting ? (
          <ActivityIndicator color={colors.onDestructive} />
        ) : (
          <Text style={[styles.deleteButtonText, { color: colors.onDestructive }]}>
            {t("delete_account_confirm_button")}
          </Text>
        )}
      </Pressable>

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
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  description: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  bullets: {
    marginBottom: 18,
    gap: 6,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    padding: 6,
    marginBottom: 18,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
