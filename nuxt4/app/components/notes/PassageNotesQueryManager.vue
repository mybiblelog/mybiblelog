<template>
  <div class="passage-notes-query-manager">
    <div class="mbl-field">
      <label class="mbl-label">{{ t('search_text') }}</label>
      <div class="mbl-control">
        <input
          v-model.trim="draft.searchText"
          class="mbl-input"
          type="text"
          data-testid="notes-query-search"
          :placeholder="t('search_placeholder')"
        >
      </div>
    </div>

    <div class="mbl-field">
      <label class="mbl-label">{{ t('tag_filters') }}</label>
      <div v-if="selectedTags.length" class="selected-tags">
        <span
          v-for="tag in selectedTags"
          :key="tag.id"
          class="selected-tag"
          :style="{ backgroundColor: tag.color }"
        >
          {{ tag.label }}
        </span>
      </div>
      <div class="tag-actions">
        <button class="mbl-button mbl-button--light" type="button" data-testid="notes-query-choose-tags" @click="openTagModal">
          {{ t('choose_tags') }}
        </button>
        <button v-if="draft.filterTags.length" class="mbl-button mbl-button--light" type="button" @click="clearTags">
          {{ t('clear_tags') }}
        </button>
      </div>
    </div>

    <div class="mbl-field query-actions">
      <button class="mbl-button mbl-button--primary" type="button" data-testid="notes-query-apply" @click="applyQuery">
        {{ t('apply') }}
      </button>
      <slot name="cancel" />
    </div>

    <AppModal :open="tagModalOpen" :title="t('choose_tags')" @close="closeTagModal">
      <template #content>
        <div class="tag-picker">
          <label
            v-for="tag in allTags"
            :key="tag.id"
            class="tag-picker-item"
            :class="{ selected: draftTags.includes(String(tag.id)) }"
            @click="toggleTag(String(tag.id))"
          >
            <span class="tag-pill" :style="{ backgroundColor: tag.color }">{{ tag.label }}</span>
          </label>
        </div>
      </template>
      <template #footer>
        <button class="mbl-button mbl-button--primary" @click="applyTagModal">{{ t('done') }}</button>
        <button class="mbl-button mbl-button--light" @click="closeTagModal">{{ t('cancel') }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import AppModal from '~/components/popups/AppModal.vue';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import type { PassageNotesQuery } from '~/helpers/passage-notes-route-query';

const props = defineProps<{
  appliedQuery: PassageNotesQuery;
  passageNoteTags?: Array<{ id: string | number; label?: string; color?: string }>;
}>();

const emit = defineEmits<{ apply: [query: Partial<PassageNotesQuery>]; cancel: [] }>();

const { t } = useI18n();
const passageNoteTagsStore = usePassageNoteTagsStore();

const allTags = computed(() => props.passageNoteTags ?? passageNoteTagsStore.passageNoteTags ?? []);

const draft = ref<Partial<PassageNotesQuery>>({
  searchText: props.appliedQuery?.searchText ?? '',
  filterTags: [...(props.appliedQuery?.filterTags ?? [])],
  filterTagMatching: props.appliedQuery?.filterTagMatching ?? 'any',
});

const tagModalOpen = ref(false);
const draftTags = ref<string[]>([]);

const selectedTags = computed(() => {
  const tagIds = draft.value.filterTags ?? [];
  return tagIds
    .map(id => allTags.value.find(t => String(t.id) === String(id)))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map(t => ({ id: t.id, label: t.label ?? '', color: t.color ?? 'var(--mbl-text-strong)' }));
});

watch(() => props.appliedQuery, (q) => {
  draft.value = {
    searchText: q?.searchText ?? '',
    filterTags: [...(q?.filterTags ?? [])],
    filterTagMatching: q?.filterTagMatching ?? 'any',
  };
}, { deep: true });

function openTagModal() {
  draftTags.value = [...(draft.value.filterTags ?? [])].map(String);
  tagModalOpen.value = true;
}

function closeTagModal() {
  tagModalOpen.value = false;
}

function toggleTag(id: string) {
  const idx = draftTags.value.indexOf(id);
  if (idx >= 0) {
    draftTags.value = draftTags.value.filter(t => t !== id);
  }
  else {
    draftTags.value = [...draftTags.value, id];
  }
}

function applyTagModal() {
  draft.value = { ...draft.value, filterTags: [...draftTags.value] };
  closeTagModal();
}

function clearTags() {
  draft.value = { ...draft.value, filterTags: [] };
}

function applyQuery() {
  emit('apply', { ...draft.value });
}
</script>

<style scoped>
.selected-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.5rem; }
.selected-tag { font-size: 0.8em; padding: 0.1rem 0.4rem; border-radius: 0.25rem; color: var(--mbl-on-accent); }
.tag-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.query-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
.tag-picker { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.5rem; }
.tag-picker-item { cursor: pointer; }
.tag-pill {
  display: inline-block;
  font-size: 0.85em;
  color: var(--mbl-on-accent);
  text-shadow: 0 0 2px var(--mbl-text-stronger);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 2px solid transparent;
}
.tag-picker-item.selected .tag-pill { border-color: var(--mbl-text-stronger); }
</style>

<i18n lang="json">
{
  "en": {
    "search_text": "Search",
    "search_placeholder": "Enter text…",
    "tag_filters": "Filter by Tags",
    "choose_tags": "Choose Tags…",
    "clear_tags": "Clear Tags",
    "done": "Done",
    "cancel": "Cancel",
    "apply": "Apply"
  },
  "de": { "search_text": "Suche", "search_placeholder": "Text eingeben…", "tag_filters": "Nach Tags filtern", "choose_tags": "Tags auswählen…", "clear_tags": "Tags löschen", "done": "Fertig", "cancel": "Abbrechen", "apply": "Anwenden" },
  "es": { "search_text": "Buscar", "search_placeholder": "Ingrese texto…", "tag_filters": "Filtrar por etiquetas", "choose_tags": "Elegir etiquetas…", "clear_tags": "Limpiar etiquetas", "done": "Hecho", "cancel": "Cancelar", "apply": "Aplicar" },
  "fr": { "search_text": "Rechercher", "search_placeholder": "Entrez le texte…", "tag_filters": "Filtrer par tags", "choose_tags": "Choisir des tags…", "clear_tags": "Effacer les tags", "done": "Terminé", "cancel": "Annuler", "apply": "Appliquer" },
  "ko": { "search_text": "검색", "search_placeholder": "텍스트 입력…", "tag_filters": "태그 필터", "choose_tags": "태그 선택…", "clear_tags": "태그 지우기", "done": "완료", "cancel": "취소", "apply": "적용" },
  "pt": { "search_text": "Pesquisar", "search_placeholder": "Digite o texto…", "tag_filters": "Filtrar por tags", "choose_tags": "Escolher tags…", "clear_tags": "Limpar tags", "done": "Concluído", "cancel": "Cancelar", "apply": "Aplicar" },
  "uk": { "search_text": "Пошук", "search_placeholder": "Введіть текст…", "tag_filters": "Фільтрувати за тегами", "choose_tags": "Вибрати теги…", "clear_tags": "Очистити теги", "done": "Готово", "cancel": "Скасувати", "apply": "Застосувати" }
}
</i18n>
