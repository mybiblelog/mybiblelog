<template>
  <section class="platform-choice-section">
    <h2 v-if="heading" class="platform-choice-heading">
      {{ heading }}
    </h2>
    <p v-if="subheading" class="platform-choice-subheading">
      {{ subheading }}
    </p>
    <div class="platform-choice-cards">
      <div class="platform-choice-card platform-choice-card--web">
        <h3 class="platform-choice-card-title">
          {{ webTitle }}
        </h3>
        <p class="platform-choice-card-description">
          {{ webDescription }}
        </p>
        <NuxtLink :to="localePath(webButtonDestination)" class="mbl-button mbl-button--primary">
          {{ webButtonText }}
        </NuxtLink>
      </div>
      <div class="platform-choice-card platform-choice-card--android">
        <h3 class="platform-choice-card-title">
          {{ androidTitle }}
        </h3>
        <p class="platform-choice-card-description">
          {{ androidDescription }}
        </p>
        <NuxtLink :to="localePath(androidButtonDestination)" class="mbl-button mbl-button--primary mbl-button--glow">
          {{ androidButtonText }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  heading?: string;
  subheading?: string;
  webTitle: string;
  webDescription: string;
  webButtonText: string;
  webButtonDestination: string;
  androidTitle: string;
  androidDescription: string;
  androidButtonText: string;
  androidButtonDestination: string;
}>(), {
  heading: '',
  subheading: '',
});

const localePath = useLocalePath();
</script>

<style scoped>
.platform-choice-section {
  margin: var(--mbl-space-3xl) 0;
  padding: 0 var(--mbl-space-xl);
  text-align: center;
}

.platform-choice-heading {
  font-size: var(--mbl-title-3);
  font-weight: 700;
  color: var(--mbl-text-strong);
  margin-bottom: var(--mbl-space-xs);
}

.platform-choice-subheading {
  font-size: var(--mbl-text-lead);
  color: var(--mbl-text-soft);
  max-width: 640px;
  margin: 0 auto var(--mbl-space-xl);
}

.platform-choice-cards {
  display: flex;
  gap: var(--mbl-space-xl);
  max-width: 900px;
  margin: 0 auto;
}

@mixin mbl-mobile {
  .platform-choice-cards { flex-direction: column; }
}

.platform-choice-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mbl-space-sm);
  padding: var(--mbl-space-xl);
  border-radius: var(--mbl-radius-xl);
}

.platform-choice-card-title {
  font-size: var(--mbl-title-5);
  font-weight: 700;
  margin: 0;
}

.platform-choice-card-description {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 var(--mbl-space-xs);
}

.platform-choice-card--web {
  background: var(--mbl-bg-muted);
  border: 1px solid var(--mbl-border);
}

.platform-choice-card--web .platform-choice-card-title {
  color: var(--mbl-text-strong);
}

.platform-choice-card--web .platform-choice-card-description {
  color: var(--mbl-text-soft);
}

.platform-choice-card--android {
  background:
    radial-gradient(circle, rgb(255 255 255 / 25%) 1.5px, transparent 1.5px) 0 0 / 22px 22px,
    linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 55%, var(--tertiary-color) 100%);
  box-shadow: var(--mbl-shadow-cta);
}

.platform-choice-card--android .platform-choice-card-title,
.platform-choice-card--android .platform-choice-card-description {
  color: var(--mbl-on-accent);
}

.platform-choice-card--android .platform-choice-card-title {
  text-shadow: 0 1px 2px rgb(0 0 0 / 15%);
}

/* Overrides the shared .mbl-button modifier only within this card's scope,
   since the vivid gradient backdrop needs a light-on-color button rather
   than the design system's default secondary-colored glow. */
.platform-choice-card--android :deep(.mbl-button--primary.mbl-button--glow) {
  background-color: var(--mbl-on-accent);
  border-color: var(--mbl-on-accent);
  color: var(--secondary-color);
}

.platform-choice-card--android :deep(.mbl-button--primary.mbl-button--glow:hover) {
  background-color: var(--mbl-on-accent);
  filter: brightness(0.95);
}
</style>
