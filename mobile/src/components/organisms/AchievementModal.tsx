import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Bible } from "@mybiblelog/shared";
import { spacing } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import {
  type AchievementDisplay,
  achievementActions,
  useCurrentAchievement,
} from "@/src/stores/achievements";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";
import { BottomSheet } from "./BottomSheet";

// Mirrors nuxt `AppAchievements.vue`: the star "stamps" in 300ms after the
// modal opens (0.5s springy scale 2→1), then 250ms later 7 particle stars fly
// outward for 1s and fade.
const STAMP_DELAY_MS = 300;
const STAMP_DURATION_MS = 500;
const PARTICLES_DELAY_MS = STAMP_DELAY_MS + 250;
const PARTICLE_DURATION_MS = 1000;
const stampEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

type ParticleSpec = {
  id: number;
  x: number;
  y: number;
  delay: number;
  rotation: number;
};

function makeParticles(): ParticleSpec[] {
  const count = 7;
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 60 + Math.random() * 20;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: Math.random() * 100,
      rotation: (Math.random() - 0.5) * 720,
    };
  });
}

function Particle({ spec }: { spec: ParticleSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withTiming(1, { duration: PARTICLE_DURATION_MS, easing: Easing.out(Easing.quad) })
    );
  }, [progress, spec.delay]);

  const style = useAnimatedStyle(() => ({
    // Invisible until its delay elapses, then flies outward while fading.
    opacity: progress.value === 0 ? 0 : 1 - progress.value,
    transform: [
      { translateX: spec.x * progress.value },
      { translateY: spec.y * progress.value },
      { rotate: `${spec.rotation * progress.value}deg` },
      { scale: 1 - 0.7 * progress.value },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.particle, style]}>
      <Icon name="star" size={32} color="starParticle" />
    </Animated.View>
  );
}

/**
 * Celebration dialog for book/Bible completion (web `AppAchievements.vue`).
 * Rendered once at the root layout; subscribes to the achievements store.
 */
export function AchievementModal() {
  const t = useT();
  const { locale } = useLocale();
  const achievement = useCurrentAchievement();
  const visible = achievement !== null;

  // Keep the last achievement rendered while the exit animation plays.
  const [display, setDisplay] = useState<AchievementDisplay | null>(null);
  if (achievement !== null && achievement !== display) setDisplay(achievement);

  const stamp = useSharedValue(0);
  const [particles, setParticles] = useState<ParticleSpec[]>([]);

  useEffect(() => {
    if (!visible) return;
    const stampTimer = setTimeout(() => {
      stamp.value = withTiming(1, { duration: STAMP_DURATION_MS, easing: stampEasing });
    }, STAMP_DELAY_MS);
    const spawnTimer = setTimeout(() => setParticles(makeParticles()), PARTICLES_DELAY_MS);
    const cleanupTimer = setTimeout(
      () => setParticles([]),
      PARTICLES_DELAY_MS + PARTICLE_DURATION_MS + 500
    );
    // The cleanup rewinds the animation so the next open starts from scratch.
    return () => {
      clearTimeout(stampTimer);
      clearTimeout(spawnTimer);
      clearTimeout(cleanupTimer);
      stamp.value = 0;
      setParticles([]);
    };
  }, [visible, stamp]);

  const starStyle = useAnimatedStyle(() => ({
    // Opacity resolves slightly ahead of the scale, matching the web timing.
    opacity: Math.min(1, stamp.value * 1.25),
    transform: [{ scale: 2 - stamp.value }],
  }));

  let title = "";
  let message = "";
  if (display?.type === "book") {
    const bookName = Bible.getBookName(display.bookIndex, locale);
    title = t("achievement_book_complete_title");
    message = t("achievement_book_complete_message", { bookName });
  } else if (display?.type === "bible") {
    title = t("achievement_bible_complete_title");
    message = t("achievement_bible_complete_message");
  }

  return (
    <BottomSheet visible={visible} variant="center" onClose={achievementActions.close}>
      <View style={styles.starContainer}>
        {particles.map((particle) => (
          <Particle key={particle.id} spec={particle} />
        ))}
        <Animated.View style={starStyle}>
          <Icon name="star" size={64} color="starGold" />
        </Animated.View>
      </View>
      <Text variant="heading" style={styles.centered}>
        {title}
      </Text>
      <Text variant="body" style={styles.centered}>
        {message}
      </Text>
      <View style={styles.footer}>
        <Button label={t("ok")} testID="achievement.close" onPress={achievementActions.close} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  starContainer: {
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  particle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
  },
  centered: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  footer: {
    marginTop: spacing.md,
    alignItems: "center",
  },
});
