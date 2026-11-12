<template>
  <p v-if="books" class="goal-outside-canon mbl-text-small">
    {{ t('outside_canon', { books }) }}
  </p>
</template>

<script setup lang="ts">
import type { ReadingGoalProgress } from '@mybiblelog/shared';
import { useGoalBooksOutsideCanon } from '~/composables/useGoalBooksOutsideCanon';

const props = defineProps<{
  progress: ReadingGoalProgress;
}>();

const { t } = useI18n();
const books = useGoalBooksOutsideCanon(() => props.progress);
</script>

<style scoped>
.goal-outside-canon {
  margin: 0;
  color: var(--mbl-warning-fg);
}
</style>

<i18n lang="json">
{
  "en": {
    "outside_canon": "Can't log {books}: deuterocanonical books are turned off in your reading settings"
  },
  "de": {
    "outside_canon": "{books} kann nicht erfasst werden: Deuterokanonische Bücher sind in Ihren Leseeinstellungen ausgeschaltet"
  },
  "es": {
    "outside_canon": "No se puede registrar {books}: los libros deuterocanónicos están desactivados en tu configuración de lectura"
  },
  "fr": {
    "outside_canon": "Impossible d'enregistrer {books} : les livres deutérocanoniques sont désactivés dans vos paramètres de lecture"
  },
  "ko": {
    "outside_canon": "{books}을(를) 기록할 수 없습니다: 읽기 설정에서 제2경전이 꺼져 있습니다"
  },
  "pt": {
    "outside_canon": "Não é possível registrar {books}: os livros deuterocanônicos estão desativados nas suas configurações de leitura"
  },
  "uk": {
    "outside_canon": "Неможливо записати {books}: девтероканонічні книги вимкнено в налаштуваннях читання"
  }
}
</i18n>
