<template>
  <div class="testament-toggle">
    <div class="testament-toggle--track" :data-active="modelValue">
      <span class="testament-toggle--thumb" aria-hidden="true" />
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="testament-toggle--button"
        :class="{ active: modelValue === option.value }"
        :disabled="!hydrated"
        :aria-label="option.label"
        :aria-pressed="modelValue === option.value"
        :data-testid="`testament-toggle-${option.value}`"
        @click="emit('update:modelValue', option.value)"
      >
        <span class="testament-toggle--label">{{ option.label }}</span>
        <span class="testament-toggle--label-short">{{ option.shortLabel }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TestamentFilter } from '@mybiblelog/shared';

defineProps<{ modelValue: TestamentFilter }>();

const emit = defineEmits<{ 'update:modelValue': [value: TestamentFilter] }>();

const { t } = useI18n();

const hydrated = useHydrated();

const options = computed<Array<{ value: TestamentFilter; label: string; shortLabel: string }>>(() => [
  { value: 'all', label: t('whole_bible'), shortLabel: t('whole_bible_short') },
  { value: 'old', label: t('old_testament'), shortLabel: t('old_testament_short') },
  { value: 'new', label: t('new_testament'), shortLabel: t('new_testament_short') },
]);
</script>

<style scoped>
.testament-toggle {
  display: flex;
  justify-content: center;
  container-type: inline-size;
}

/* Equal 1fr columns keep the three slots the same width as the longest label,
   which is what the thumb's one-third geometry below assumes. */
.testament-toggle--track {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  max-width: 100%;
  padding: var(--mbl-space-2xs);
  border: 1px solid var(--mbl-border-strong);
  border-radius: var(--mbl-radius-pill);
  background: var(--mbl-bg-muted);
}

/* Sliding indicator: one third of the track's inner width, moved a full slot per position. */
.testament-toggle--thumb {
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0.25rem;
  width: calc((100% - 0.5rem) / 3);
  border-radius: var(--mbl-radius-pill);
  background: var(--mbl-link-bright);
  box-shadow: var(--mbl-shadow-card);
  pointer-events: none;
  transition: transform 0.2s ease;
}

.testament-toggle--track[data-active="old"] .testament-toggle--thumb {
  transform: translateX(100%);
}

.testament-toggle--track[data-active="new"] .testament-toggle--thumb {
  transform: translateX(200%);
}

.testament-toggle--button {
  position: relative;
  min-width: 5rem;
  padding: var(--mbl-space-xs) var(--mbl-space-sm);
  border: none;
  border-radius: var(--mbl-radius-pill);
  background: none;
  color: var(--mbl-text-subtle);
  cursor: pointer;
  transition: color 0.2s;
  font-size: 0.9rem;
}

.testament-toggle--button:hover {
  color: var(--mbl-text);
}

.testament-toggle--button.active {
  color: var(--mbl-on-accent);
}

/*
 * Labels degrade to a curated abbreviation rather than an ellipsis: the full
 * names only fit once the page column is wide enough for the longest locale
 * (es "Antiguo Testamento" needs a 480px track), so 32rem is the cutoff with
 * room to spare for future translations. Both spans are always in the DOM;
 * `aria-label` carries the full name either way so the accessible name never
 * shrinks with the visible one.
 */
.testament-toggle--label-short {
  display: none;
}

@container (max-width: 32rem) {
  .testament-toggle--label {
    display: none;
  }

  .testament-toggle--label-short {
    display: inline;
  }
}

@media (prefers-reduced-motion: reduce) {
  .testament-toggle--thumb {
    transition: none;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "whole_bible": "Whole Bible",
    "whole_bible_short": "Bible",
    "old_testament": "Old Testament",
    "old_testament_short": "OT",
    "new_testament": "New Testament",
    "new_testament_short": "NT"
  },
  "de": {
    "whole_bible": "Ganze Bibel",
    "whole_bible_short": "Bibel",
    "old_testament": "Altes Testament",
    "old_testament_short": "AT",
    "new_testament": "Neues Testament",
    "new_testament_short": "NT"
  },
  "es": {
    "whole_bible": "Toda la Biblia",
    "whole_bible_short": "Biblia",
    "old_testament": "Antiguo Testamento",
    "old_testament_short": "AT",
    "new_testament": "Nuevo Testamento",
    "new_testament_short": "NT"
  },
  "fr": {
    "whole_bible": "Toute la Bible",
    "whole_bible_short": "Bible",
    "old_testament": "Ancien Testament",
    "old_testament_short": "AT",
    "new_testament": "Nouveau Testament",
    "new_testament_short": "NT"
  },
  "ko": {
    "whole_bible": "성경 전체",
    "whole_bible_short": "성경",
    "old_testament": "구약",
    "old_testament_short": "구약",
    "new_testament": "신약",
    "new_testament_short": "신약"
  },
  "pt": {
    "whole_bible": "Bíblia inteira",
    "whole_bible_short": "Bíblia",
    "old_testament": "Antigo Testamento",
    "old_testament_short": "AT",
    "new_testament": "Novo Testamento",
    "new_testament_short": "NT"
  },
  "uk": {
    "whole_bible": "Уся Біблія",
    "whole_bible_short": "Біблія",
    "old_testament": "Старий Заповіт",
    "old_testament_short": "СЗ",
    "new_testament": "Новий Заповіт",
    "new_testament_short": "НЗ"
  }
}
</i18n>
