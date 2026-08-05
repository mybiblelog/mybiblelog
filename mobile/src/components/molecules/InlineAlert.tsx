import { type ReactNode, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "@/src/design";
import type { ThemeColors } from "@/src/design";
import { getCache, setCache } from "@/src/storage/dateVerseCountsCache";
import { Button } from "../atoms/Button";
import { Icon, type IconName } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { Text } from "../atoms/Text";
import { Card, type CardTone } from "./Card";

type Props = {
  /** Leading icon. */
  icon?: IconName;
  iconColor?: keyof ThemeColors;
  title: string;
  text?: string;
  /** Optional call-to-action button rendered under the text. */
  ctaLabel?: string;
  ctaIcon?: IconName;
  onPressCta?: () => void;
  /** Extra content rendered under the text (e.g. an offline notice). */
  children?: ReactNode;
  /** Dismiss (X) button accessibility label. Omit to make the alert non-dismissible. */
  dismissLabel?: string;
  onDismiss?: () => void;
  /**
   * When set, dismissal persists for `dismissMinutes` under this cache key, so
   * the alert stays hidden across launches for that window.
   */
  dismissKey?: string;
  dismissMinutes?: number;
  /** Callout tone, forwarded to Card (web `.mbl-message--info` / `--success`). */
  tone?: CardTone;
  /** A second action beside the CTA, mirroring web's `.mbl-button-group`. */
  secondaryCtaLabel?: string;
  onPressSecondaryCta?: () => void;
  ctaDisabled?: boolean;
  testID?: string;
};

/**
 * Reusable inline alert / callout — an icon, a title + text, an optional CTA, and
 * an optional dismiss button whose dismissal can persist for a window (via the
 * TTL cache). Styling mirrors the "not logged in" card in `settings/account.tsx`.
 */
export function InlineAlert({
  icon,
  iconColor = "primary",
  title,
  text,
  ctaLabel,
  ctaIcon,
  onPressCta,
  children,
  dismissLabel,
  onDismiss,
  dismissKey,
  dismissMinutes = 60 * 24 * 7,
  tone = "neutral",
  secondaryCtaLabel,
  onPressSecondaryCta,
  ctaDisabled = false,
  testID,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  // When a persisted dismiss key is used, wait until we've read the cache before
  // rendering so a previously-dismissed alert doesn't flash on mount.
  const [hydrated, setHydrated] = useState(!dismissKey);

  useEffect(() => {
    if (!dismissKey) return;
    let active = true;
    void (async () => {
      const wasDismissed = await getCache<boolean>(dismissKey);
      if (!active) return;
      if (wasDismissed) setDismissed(true);
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, [dismissKey]);

  if (dismissed || !hydrated) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (dismissKey) void setCache(dismissKey, true, dismissMinutes);
    onDismiss?.();
  };

  const dismissible = Boolean(dismissLabel);

  return (
    <Card testID={testID} tone={tone} style={styles.card}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={22} color={iconColor} /> : null}
        <View style={styles.textCol}>
          <Text variant="bodyStrong">{title}</Text>
          {text ? (
            <Text variant="caption" color="mutedText">
              {text}
            </Text>
          ) : null}
        </View>
        {dismissible ? (
          <IconButton
            name="close"
            accessibilityLabel={dismissLabel as string}
            onPress={handleDismiss}
            size={18}
            style={styles.dismiss}
          />
        ) : null}
      </View>

      {children}

      {ctaLabel && onPressCta ? (
        <View style={styles.actions}>
          <Button
            label={ctaLabel}
            leftIcon={ctaIcon}
            fullWidth={!secondaryCtaLabel}
            disabled={ctaDisabled}
            onPress={onPressCta}
            style={secondaryCtaLabel ? styles.action : undefined}
          />
          {secondaryCtaLabel && onPressSecondaryCta ? (
            <Button
              label={secondaryCtaLabel}
              variant="secondary"
              onPress={onPressSecondaryCta}
              style={styles.action}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  textCol: { flex: 1, gap: spacing["2xs"] },
  dismiss: { marginTop: -spacing.xs, marginRight: -spacing.xs },
  actions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
  action: { flex: 1 },
});
