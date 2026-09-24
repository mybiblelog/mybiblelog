<template>
  <aside class="app-callout">
    <div v-if="imageSrc" class="app-callout-image">
      <img :src="imageSrc" :alt="imageAlt" width="750" height="1334" loading="lazy">
    </div>
    <div class="app-callout-content">
      <p class="app-callout-title" v-html="title" />
      <p v-if="description" class="app-callout-description" v-html="description" />
      <ul v-if="list.length > 0" class="app-callout-list">
        <li v-for="(item, index) in list" :key="index" v-html="item" />
      </ul>
      <div class="app-callout-cta">
        <NuxtLink :to="localePath(buttonDestination)" class="mbl-button mbl-button--primary">
          {{ buttonText }}
        </NuxtLink>
      </div>
      <p v-if="note" class="app-callout-note" v-html="note" />
    </div>
  </aside>
</template>

<script setup lang="ts">
// Rendered via v-html: these props must only come from trusted repo-authored
// content (web/content/<locale>/*.md or page components), never from
// translator/Crowdin-supplied strings.
withDefaults(defineProps<{
  title: string;
  description?: string;
  list?: string[];
  imageSrc?: string;
  imageAlt?: string;
  buttonText?: string;
  buttonDestination?: string;
  note?: string;
}>(), {
  description: '',
  list: () => [],
  imageSrc: '',
  imageAlt: '',
  buttonText: 'Start Tracking Free',
  buttonDestination: '/register',
  note: 'Completely free. No ads. Sign up with email or Google.',
});

const localePath = useLocalePath();
</script>

<style scoped>
.app-callout {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-xl);
  margin: var(--mbl-space-2xl) 0;
  padding: var(--mbl-space-xl);
  border: 1px solid var(--mbl-primary-soft-border);
  border-radius: var(--mbl-radius-card);
  background: var(--mbl-primary-soft);
}

@mixin mbl-mobile {
  .app-callout { flex-direction: column; }
}

.app-callout-image {
  flex: 0 0 160px;
}

.app-callout-image img {
  width: 160px;
  height: auto;
  border-radius: var(--mbl-radius-lg);
  box-shadow: var(--mbl-shadow-card);
}

.app-callout-content {
  flex: 1;
}

.app-callout-title {
  margin: 0 0 var(--mbl-space-xs);
  font-size: var(--mbl-title-5);
  font-weight: 700;
  color: var(--mbl-text-strong);
}

.app-callout-description {
  margin: 0 0 var(--mbl-space-sm);
  color: var(--mbl-text-body);
}

.app-callout-list {
  list-style: none;
  padding-left: 0;
  margin: 0 0 var(--mbl-space-md);
}

.app-callout-list li {
  position: relative;
  padding-left: var(--mbl-space-xl);
  margin: var(--mbl-space-2xs) 0;
  color: var(--mbl-text-body);
}

.app-callout-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--tertiary-color);
  font-weight: bold;
}

.app-callout-cta {
  margin-top: var(--mbl-space-sm);
}

.app-callout-note {
  margin: var(--mbl-space-xs) 0 0;
  font-size: 0.875rem;
  color: var(--mbl-text-subtle);
}
</style>
