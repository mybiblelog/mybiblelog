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
        <NuxtLink :to="localePath('/register')" class="mbl-button mbl-button--primary mbl-button--lg">
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
  padding: 4rem 1.5rem;
  background: linear-gradient(135deg, var(--mbl-primary-soft) 0%, var(--mbl-secondary-soft) 50%, var(--mbl-tertiary-soft) 100%);
  border-radius: 12px;
  margin: 0 0 2rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media screen and (max-width: 768px) {
  .hero-title { font-size: 2.5rem; }
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--mbl-text-body);
  margin-bottom: 1.5rem;
  font-style: italic;
}

@media screen and (max-width: 768px) {
  .hero-subtitle { font-size: 1.25rem; }
}

.hero-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--mbl-text-soft);
  margin-bottom: 2.5rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

@media screen and (max-width: 768px) {
  .hero-description { font-size: 1rem; margin-bottom: 2rem; }
}

.hero-description em { font-style: italic; color: var(--mbl-text-strong); }
.hero-description strong { font-weight: 600; color: var(--secondary-color); }

.hero-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.mbl-button.mbl-button--primary.mbl-button--lg {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  color: var(--mbl-on-accent);
  font-weight: 600;
  padding: 0.5rem 2.5rem;
  font-size: 1.125rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px var(--mbl-primary-glow);
}

.mbl-button.mbl-button--primary.mbl-button--lg:hover {
  background-color: var(--secondary-color-hover);
  border-color: var(--secondary-color-hover);
  color: var(--mbl-on-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--mbl-primary-glow-strong);
}

.mbl-button.mbl-button--primary.mbl-button--lg:active { transform: translateY(0); }

.hero-cta-note {
  font-size: 0.9rem;
  color: var(--mbl-text-subtle);
  margin: 0;
}

.hero-cta-note em { font-style: italic; }
</style>
