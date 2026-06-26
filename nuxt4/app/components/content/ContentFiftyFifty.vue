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
        <ul v-if="resolvedList.length > 0" class="fifty-fifty-list">
          <li v-for="(item, index) in resolvedList" :key="index" v-html="item" />
        </ul>
        <div v-if="buttonText && buttonDestination" class="fifty-fifty-cta">
          <NuxtLink :to="localePath(buttonDestination)" class="mbl-button mbl-button--primary">
            {{ buttonText }}
          </NuxtLink>
        </div>
        <p v-if="note" class="fifty-fifty-note" v-html="note" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  imageSrc: string;
  imageAlt?: string;
  imageWidth?: string;
  imageHeight?: string;
  imageContainerClass?: string;
  imageFetchPriority?: 'high' | 'low' | 'auto';
  title: string;
  subtitle?: string;
  description?: string;
  list?: string[] | string;
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

// @nuxt/content v3 MDC passes array props as single-quoted JS array strings
// FIXME: tech debt from Nuxt migration
const resolvedList = computed((): string[] => {
  if (!props.list) return [];
  if (Array.isArray(props.list)) return props.list;
  const str = (props.list as string).trim();
  if (!str.startsWith('[')) return [];
  try {
    return JSON.parse(str);
  } catch {
    // Convert single-quoted JS array to JSON; protect escaped apostrophes first
    const APOS = '\x00';
    const jsonStr = str
      .replace(/\\'/g, APOS)
      .replace(/'/g, '"')
      .replace(new RegExp(APOS, 'g'), "'");
    try {
      return JSON.parse(jsonStr);
    } catch {
      return [];
    }
  }
});

const localePath = useLocalePath();
</script>

<style scoped>
.fifty-fifty-section {
  margin: 3rem 0;
  padding: 2rem 0;
}

.fifty-fifty-container {
  display: flex;
  align-items: center;
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

@media screen and (max-width: 768px) {
  .fifty-fifty-container { flex-direction: column; gap: 2rem; }
}

.fifty-fifty-section--reverse .fifty-fifty-container { flex-direction: row-reverse; }

@media screen and (max-width: 768px) {
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
  gap: 1rem;
}

.fifty-fifty-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1.3;
  color: var(--mbl-text-strong);
}

@media screen and (max-width: 768px) {
  .fifty-fifty-title { font-size: 1.75rem; }
}

.fifty-fifty-subtitle {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--secondary-color);
  line-height: 1.4;
}

@media screen and (max-width: 768px) {
  .fifty-fifty-subtitle { font-size: 1.125rem; }
}

.fifty-fifty-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--mbl-text-soft);
  margin-bottom: 0.5rem;
}

@media screen and (max-width: 768px) {
  .fifty-fifty-description { font-size: 1rem; }
}

.fifty-fifty-list {
  list-style: none;
  padding-left: 0;
  margin: 1rem 0;
}

.fifty-fifty-list li {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--mbl-text-soft);
  padding: 0.5rem 0 0.5rem 1.5rem;
  position: relative;
}

@media screen and (max-width: 768px) {
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

.fifty-fifty-cta { margin-top: 1rem; }

.fifty-fifty-cta .mbl-button.mbl-button--primary {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  color: var(--mbl-on-accent);
  font-weight: 600;
  padding: 0.5rem 2rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px var(--mbl-primary-glow);
}

.fifty-fifty-cta .mbl-button.mbl-button--primary:hover {
  background-color: var(--secondary-color-hover);
  border-color: var(--secondary-color-hover);
  color: var(--mbl-on-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--mbl-primary-glow-strong);
}

.fifty-fifty-cta .mbl-button.mbl-button--primary:active { transform: translateY(0); }

.fifty-fifty-note {
  font-size: 0.875rem;
  color: var(--mbl-text-subtle);
  margin-top: 0.5rem;
  font-style: italic;
}
</style>
