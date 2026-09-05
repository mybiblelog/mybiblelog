<template>
  <section class="hero-section">
    <div class="hero-content">
      <h1 class="hero-title">
        <strong>{{ title }}</strong>
      </h1>
      <p class="hero-subtitle">
        <em>{{ subtitle }}</em>
      </p>
      <p class="hero-description" v-html="description" />
      <div class="hero-cta">
        <NuxtLink :to="localePath('/register')" class="mbl-button mbl-button--primary mbl-button--lg mbl-button--glow">
          {{ buttonText }}
        </NuxtLink>
        <p class="hero-cta-note">
          <em>{{ ctaNote }}</em>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// `description` is rendered via v-html: must only come from trusted repo-authored
// content (web/content/<locale>/*.md), never from translator/Crowdin-supplied strings.
defineProps<{
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  ctaNote: string;
}>();

const localePath = useLocalePath();
</script>

<style scoped>
.hero-section {
  padding: var(--mbl-space-4xl) var(--mbl-space-xl);
  background: linear-gradient(135deg, var(--mbl-primary-soft) 0%, var(--mbl-secondary-soft) 50%, var(--mbl-tertiary-soft) 100%);
  margin: 0 0 var(--mbl-space-2xl);
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: var(--mbl-title-hero);
  font-weight: 700;
  margin-bottom: var(--mbl-space-md);
  line-height: 1.2;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--mbl-title-4);
  color: var(--mbl-text-body);
  margin-bottom: var(--mbl-space-xl);
  font-style: italic;
}

.hero-description {
  font-size: var(--mbl-text-lead);
  line-height: 1.7;
  color: var(--mbl-text-soft);
  margin-bottom: var(--mbl-space-2xl);
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.hero-description em { font-style: italic; color: var(--mbl-text-strong); }
.hero-description strong { font-weight: 600; color: var(--secondary-color); }

.hero-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mbl-space-sm);
}

/* Sits between --lg (1.25rem) and the base size; the rest comes from --glow. */
.mbl-button--glow.mbl-button--lg {
  font-size: 1.125rem;
}

.hero-cta-note {
  font-size: 0.9rem;
  color: var(--mbl-text-subtle);
  margin: 0;
}

.hero-cta-note em { font-style: italic; }
</style>
