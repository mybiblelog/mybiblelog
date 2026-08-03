<template>
  <section class="fifty-fifty-section" :class="{ 'fifty-fifty-section--reverse': reverse }">
    <div class="fifty-fifty-container content-column">
      <div class="fifty-fifty-image">
        <div :class="imageContainerClass">
          <img
            :src="imageSrc"
            :alt="imageAlt || title"
            :width="imageWidth || undefined"
            :height="imageHeight || undefined"
            :fetchpriority="imageFetchPriority || undefined"
          >
        </div>
      </div>
      <div class="fifty-fifty-content">
        <h2 class="fifty-fifty-title" v-html="title" />
        <p class="fifty-fifty-subtitle" v-html="subtitle" />
        <p class="fifty-fifty-description" v-html="description" />
        <ul v-if="list.length > 0" class="fifty-fifty-list">
          <li v-for="(item, index) in list" :key="index" v-html="item" />
        </ul>
        <div v-if="buttonText && buttonDestination" class="fifty-fifty-cta">
          <NuxtLink :to="localePath(buttonDestination)" class="mbl-button mbl-button--primary mbl-button--glow">
            {{ buttonText }}
          </NuxtLink>
        </div>
        <p v-if="note" class="fifty-fifty-note" v-html="note" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Rendered via v-html: these props must only come from trusted repo-authored
// content (web/content/<locale>/*.md), never from translator/Crowdin-supplied strings.
withDefaults(defineProps<{
  imageSrc: string;
  imageAlt?: string;
  imageWidth?: string;
  imageHeight?: string;
  imageContainerClass?: string;
  imageFetchPriority?: 'high' | 'low' | 'auto';
  title: string;
  subtitle?: string;
  description?: string;
  list?: string[];
  buttonText?: string;
  buttonDestination?: string;
  note?: string;
  reverse?: boolean;
}>(), {
  imageAlt: '',
  imageWidth: '',
  imageHeight: '',
  imageContainerClass: '',
  imageFetchPriority: 'auto',
  subtitle: '',
  description: '',
  list: () => [],
  buttonText: '',
  buttonDestination: '',
  note: '',
  reverse: false,
});

const localePath = useLocalePath();
</script>

<style scoped>
.fifty-fifty-section {
  margin: var(--mbl-space-3xl) 0;
  padding: var(--mbl-space-2xl) 0;
}

.fifty-fifty-container {
  display: flex;
  align-items: center;
  gap: var(--mbl-space-3xl);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--mbl-space-xl);
}

@mixin mbl-mobile {
  .fifty-fifty-container { flex-direction: column; gap: var(--mbl-space-2xl); }
}

.fifty-fifty-section--reverse .fifty-fifty-container { flex-direction: row-reverse; }

@mixin mbl-mobile {
  .fifty-fifty-section--reverse .fifty-fifty-container { flex-direction: column; }
}

.fifty-fifty-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fifty-fifty-image img {
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  height: auto;
  object-fit: contain;
}

.fifty-fifty-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--mbl-space-md);
}

.fifty-fifty-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--mbl-space-xs);
  line-height: 1.3;
  color: var(--mbl-text-strong);
}

@mixin mbl-mobile {
  .fifty-fifty-title { font-size: 1.75rem; }
}

.fifty-fifty-subtitle {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: var(--mbl-space-xs);
  color: var(--secondary-color);
  line-height: 1.4;
}

@mixin mbl-mobile {
  .fifty-fifty-subtitle { font-size: 1.125rem; }
}

.fifty-fifty-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--mbl-text-soft);
  margin-bottom: var(--mbl-space-xs);
}

@mixin mbl-mobile {
  .fifty-fifty-description { font-size: 1rem; }
}

.fifty-fifty-list {
  list-style: none;
  padding-left: 0;
  margin: var(--mbl-space-md) 0;
}

.fifty-fifty-list li {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--mbl-text-soft);
  padding: var(--mbl-space-xs) 0 var(--mbl-space-xs) var(--mbl-space-xl);
  position: relative;
}

@mixin mbl-mobile {
  .fifty-fifty-list li { font-size: 1rem; }
}

.fifty-fifty-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--tertiary-color);
  font-weight: bold;
  font-size: 1.25rem;
}

.fifty-fifty-cta { margin-top: var(--mbl-space-md); }

.fifty-fifty-note {
  font-size: 0.875rem;
  color: var(--mbl-text-subtle);
  margin-top: var(--mbl-space-xs);
  font-style: italic;
}
</style>
