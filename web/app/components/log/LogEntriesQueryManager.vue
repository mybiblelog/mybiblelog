<template>
  <div class="log-entries-query-manager">
    <div>
      <div class="mbl-field">
        <label class="mbl-label">{{ t('first_date') }}</label>
        <div class="mbl-control">
          <input
            v-model.trim="draft.startDate"
            class="mbl-input"
            type="date"
            :max="draft.endDate || undefined"
          >
        </div>
      </div>

      <div class="mbl-field">
        <label class="mbl-label">{{ t('last_date') }}</label>
        <div class="mbl-control">
          <input
            v-model.trim="draft.endDate"
            class="mbl-input"
            type="date"
            :min="draft.startDate || undefined"
          >
        </div>
      </div>

      <hr class="log-entries-query-manager__divider">

      <div class="mbl-field">
        <label class="mbl-label">{{ t('passage') }}</label>
        <verse-input v-model="passageRangeModel" :multi-verse="true" />
      </div>

      <hr class="log-entries-query-manager__divider">

      <div class="mbl-field">
        <label class="mbl-label">{{ t('sort') }}</label>
        <div class="mbl-control">
          <label class="mbl-radio">
            <input v-model="draft.sortDirection" type="radio" value="descending">
            {{ t('sort_newest_first') }}
          </label>
        </div>
        <div class="mbl-control">
          <label class="mbl-radio">
            <input v-model="draft.sortDirection" type="radio" value="ascending">
            {{ t('sort_oldest_first') }}
          </label>
        </div>
      </div>

      <hr class="log-entries-query-manager__divider">

      <div class="mbl-field">
        <label class="mbl-label">{{ t('page_size') }}</label>
        <div class="mbl-control">
          <div class="mbl-select">
            <select :value="draft.limit" @change="draft.limit = Number(($event.target as HTMLSelectElement).value)">
              <option :value="10">
                {{ t('page_size_option', { n: 10 }) }}
              </option>
              <option :value="20">
                {{ t('page_size_option', { n: 20 }) }}
              </option>
              <option :value="50">
                {{ t('page_size_option', { n: 50 }) }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="log-entries-query-manager__actions">
        <button class="mbl-button mbl-button--primary" type="button" :disabled="!isDirty" @click="applyDraft">
          {{ t('apply') }}
        </button>
        <button class="mbl-button mbl-button--light" type="button" :disabled="!isDirty" @click="cancelDraft">
          {{ t('cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import VerseInput from '~/components/forms/VerseInput.vue';
import { useDialogStore } from '~/stores/dialog';
import type { LogEntriesSortDirection } from '~/helpers/log-entries-route-query';

type ManagedDraft = {
  limit: number;
  sortDirection: LogEntriesSortDirection;
  startDate: string;
  endDate: string;
  filterPassageStartVerseId: number;
  filterPassageEndVerseId: number;
};

type AppliedQueryLike = Partial<ManagedDraft>;

const props = withDefaults(defineProps<{
  appliedQuery?: AppliedQueryLike;
}>(), {
  appliedQuery: () => ({}),
});

const emit = defineEmits<{
  apply: [value: ManagedDraft];
  cancel: [];
}>();

const { t } = useI18n();

const DEFAULT_DRAFT: ManagedDraft = {
  limit: 10,
  sortDirection: 'descending',
  startDate: '',
  endDate: '',
  filterPassageStartVerseId: 0,
  filterPassageEndVerseId: 0,
};

function normalizeDateString(value: unknown): string {
  const v = `${value ?? ''}`.trim();
  if (!v) { return ''; }
  return dayjs(v, 'YYYY-MM-DD', true).isValid() ? v : '';
}

function pickManagedQuery(query: AppliedQueryLike | null): ManagedDraft {
  const q = query || {};
  return {
    limit: Number(q.limit ?? DEFAULT_DRAFT.limit),
    sortDirection: q.sortDirection ?? DEFAULT_DRAFT.sortDirection,
    startDate: normalizeDateString(q.startDate ?? DEFAULT_DRAFT.startDate),
    endDate: normalizeDateString(q.endDate ?? DEFAULT_DRAFT.endDate),
    filterPassageStartVerseId: Number(q.filterPassageStartVerseId ?? DEFAULT_DRAFT.filterPassageStartVerseId),
    filterPassageEndVerseId: Number(q.filterPassageEndVerseId ?? DEFAULT_DRAFT.filterPassageEndVerseId),
  };
}

function deepEqualManaged(a: ManagedDraft, b: ManagedDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const baseline = ref<ManagedDraft>(pickManagedQuery(props.appliedQuery));
const draft = ref<ManagedDraft>(pickManagedQuery(props.appliedQuery));

const isDirty = computed(() => !deepEqualManaged(draft.value, baseline.value));

const passageRangeModel = computed({
  get() {
    const startVerseId = Number(draft.value.filterPassageStartVerseId || 0);
    const endVerseId = Number(draft.value.filterPassageEndVerseId || 0);
    if (!startVerseId || !endVerseId) { return null; }
    return { startVerseId, endVerseId };
  },
  set(range: { startVerseId: number; endVerseId: number } | null) {
    if (!range) {
      draft.value = { ...draft.value, filterPassageStartVerseId: 0, filterPassageEndVerseId: 0 };
      return;
    }
    draft.value = {
      ...draft.value,
      filterPassageStartVerseId: Number(range.startVerseId),
      filterPassageEndVerseId: Number(range.endVerseId),
    };
  },
});

watch(() => props.appliedQuery, (nextAppliedQuery) => {
  if (isDirty.value) { return; }
  baseline.value = pickManagedQuery(nextAppliedQuery);
  draft.value = pickManagedQuery(nextAppliedQuery);
}, { deep: true });

function resetDraftToApplied() {
  baseline.value = pickManagedQuery(props.appliedQuery);
  draft.value = pickManagedQuery(props.appliedQuery);
}

async function confirmAndReset() {
  const dialogStore = useDialogStore();
  const confirmed = await dialogStore.confirm({ message: t('reset_confirm') });
  if (!confirmed) { return; }

  const update = pickManagedQuery(structuredClone(DEFAULT_DRAFT));
  baseline.value = pickManagedQuery(update);
  draft.value = pickManagedQuery(update);
  emit('apply', update);
}

function applyDraft() {
  const update = pickManagedQuery(draft.value);
  baseline.value = pickManagedQuery(update);
  draft.value = pickManagedQuery(update);
  emit('apply', update);
}

function cancelDraft() {
  resetDraftToApplied();
  emit('cancel');
}

defineExpose({ confirmAndReset, cancelDraft, resetDraftToApplied });
</script>

<i18n lang="json">
{
  "en": {
    "title": "View Options",
    "reset": "Reset",
    "reset_confirm": "Are you sure you want to reset search/filter/sort settings?",
    "first_date": "First Date",
    "last_date": "Last Date",
    "passage": "Filter by Passage",
    "sort": "Sort",
    "sort_newest_first": "Newest First",
    "sort_oldest_first": "Oldest First",
    "page_size": "Page Size",
    "page_size_option": "{n}+",
    "apply": "Apply",
    "cancel": "Cancel"
  },
  "de": {
    "title": "Ansichtsoptionen",
    "reset": "Zurücksetzen",
    "reset_confirm": "Möchten Sie die Such-/Filter-/Sortiereinstellungen wirklich zurücksetzen?",
    "first_date": "Von (Datum)",
    "last_date": "Bis (Datum)",
    "passage": "Nach Passage filtern",
    "sort": "Sortieren",
    "sort_newest_first": "Neueste zuerst",
    "sort_oldest_first": "Älteste zuerst",
    "page_size": "Seitengröße",
    "page_size_option": "{n}+",
    "apply": "Anwenden",
    "cancel": "Abbrechen"
  },
  "es": {
    "title": "Opciones de vista",
    "reset": "Restablecer",
    "reset_confirm": "¿Está seguro de que desea restablecer la búsqueda / filtros / orden?",
    "first_date": "Primera fecha",
    "last_date": "Última fecha",
    "passage": "Filtrar por pasaje",
    "sort": "Ordenar",
    "sort_newest_first": "Más reciente primero",
    "sort_oldest_first": "Más antiguo primero",
    "page_size": "Tamaño de página",
    "page_size_option": "{n}+",
    "apply": "Aplicar",
    "cancel": "Cancelar"
  },
  "fr": {
    "title": "Options d'affichage",
    "reset": "Réinitialiser",
    "reset_confirm": "Êtes-vous sûr de vouloir réinitialiser la recherche / les filtres / le tri ?",
    "first_date": "Première date",
    "last_date": "Dernière date",
    "passage": "Filtrer par passage",
    "sort": "Trier",
    "sort_newest_first": "Le plus récent d'abord",
    "sort_oldest_first": "Plus ancien en premier",
    "page_size": "Taille de page",
    "page_size_option": "{n}+",
    "apply": "Appliquer",
    "cancel": "Annuler"
  },
  "ko": {
    "title": "보기 옵션",
    "reset": "초기화",
    "reset_confirm": "검색·필터·정렬 설정을 초기화할까요?",
    "first_date": "시작 일자",
    "last_date": "종료 일자",
    "passage": "범위 필터",
    "sort": "정렬",
    "sort_newest_first": "최신순",
    "sort_oldest_first": "오래된순",
    "page_size": "페이지 크기",
    "page_size_option": "{n}+",
    "apply": "적용",
    "cancel": "취소"
  },
  "pt": {
    "title": "Opções de visualização",
    "reset": "Reiniciar",
    "reset_confirm": "Tem certeza de que deseja reiniciar as configurações de busca / filtro / ordenação?",
    "first_date": "Primeira data",
    "last_date": "Última data",
    "passage": "Filtrar por passagem",
    "sort": "Ordenar",
    "sort_newest_first": "Mais Recentes Primeiro",
    "sort_oldest_first": "Mais Antigos Primeiro",
    "page_size": "Tamanho da página",
    "page_size_option": "{n}+",
    "apply": "Aplicar",
    "cancel": "Cancelar"
  },
  "uk": {
    "title": "Параметри перегляду",
    "reset": "Скинути",
    "reset_confirm": "Ви впевнені, що хочете скинути налаштування пошуку / фільтра / сортування?",
    "first_date": "Перша дата",
    "last_date": "Остання дата",
    "passage": "Фільтрувати за уривком",
    "sort": "Сортувати",
    "sort_newest_first": "Спочатку нові",
    "sort_oldest_first": "Спочатку старі",
    "page_size": "Розмір сторінки",
    "page_size_option": "{n}+",
    "apply": "Застосувати",
    "cancel": "Скасувати"
  }
}
</i18n>

<style scoped>
.log-entries-query-manager__divider { margin: 1rem 0; }

.log-entries-query-manager__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
