<template>
  <div class="passage-notes-query-manager">
    <div>
      <div class="mbl-field">
        <label class="mbl-label">{{ $t('search_text') }}</label>
        <div class="mbl-control">
          <input
            v-model.trim="draft.searchText"
            class="mbl-input"
            type="text"
            data-testid="notes-query-search"
            :placeholder="$t('search_placeholder')"
          >
        </div>
      </div>

      <hr class="passage-notes-query-manager__divider">

      <div class="mbl-field">
        <label class="mbl-label">{{ $t('tag_filters') }}</label>
        <div v-if="hasSelectedTags" class="passage-notes-query-manager__selected-tags">
          <span
            v-for="tag in selectedTags"
            :key="tag.id"
            class="passage-notes-query-manager__selected-tag"
            :style="{ '--tag-color': tag?.color || 'var(--mbl-bg-disabled)' }"
          >
            {{ tag.label || tag.id }}
          </span>
        </div>
        <div class="passage-notes-query-manager__tag-actions">
          <button class="mbl-button mbl-button--light" type="button" data-testid="notes-query-choose-tags" @click="openTagFilterModal">
            {{ $t('tag_select.choose') }}
          </button>
          <button
            v-if="hasSelectedTags"
            class="mbl-button mbl-button--light"
            type="button"
            @click="clearTagSelection"
          >
            {{ $t('tag_select.clear') }}
          </button>
        </div>
      </div>

      <div v-if="!hasSelectedTags" class="mbl-field">
        <div class="mbl-control">
          <label class="mbl-checkbox">
            <input v-model="onlyUntaggedNotes" type="checkbox" data-testid="notes-query-only-untagged">
            {{ $t('tag_only_untagged') }}
          </label>
        </div>
      </div>

      <div v-if="hasSelectedTags" class="mbl-field">
        <label class="mbl-label">{{ $t('tag_match') }}</label>
        <div class="mbl-control">
          <label class="mbl-radio">
            <input v-model="draft.filterTagMatching" type="radio" value="any" data-testid="notes-query-tag-match-any">
            {{ $t('tag_match_any') }}
          </label>
        </div>
        <div class="mbl-control">
          <label class="mbl-radio">
            <input v-model="draft.filterTagMatching" type="radio" value="all" data-testid="notes-query-tag-match-all">
            {{ $t('tag_match_all') }}
          </label>
        </div>
        <div class="mbl-control">
          <label class="mbl-radio">
            <input v-model="draft.filterTagMatching" type="radio" value="exact" data-testid="notes-query-tag-match-exact">
            {{ $t('tag_match_exact') }}
          </label>
        </div>
      </div>

      <hr class="passage-notes-query-manager__divider">

      <div class="mbl-field">
        <label class="mbl-label">{{ $t('passage') }}</label>
        <verse-input v-model="passageRangeModel" :multi-verse="true" input-test-id="notes-query-passage" />
      </div>

      <div v-if="hasSelectedPassage" class="mbl-field">
        <label class="mbl-label">{{ $t('passage_match') }}</label>
        <div class="mbl-control">
          <label class="mbl-radio passage-notes-query-manager__radio-option">
            <input v-model="draft.filterPassageMatching" type="radio" value="inclusive" data-testid="notes-query-passage-match-inclusive">
            <span class="passage-notes-query-manager__radio-title">{{ $t('passage_match_inclusive') }}</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="passage-notes-query-manager__radio-help" v-html="$t('passage_match_inclusive_description')" />
          </label>
        </div>
        <div class="mbl-control">
          <label class="mbl-radio passage-notes-query-manager__radio-option">
            <input v-model="draft.filterPassageMatching" type="radio" value="exclusive" data-testid="notes-query-passage-match-exclusive">
            <span class="passage-notes-query-manager__radio-title">{{ $t('passage_match_exclusive') }}</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="passage-notes-query-manager__radio-help" v-html="$t('passage_match_exclusive_description')" />
          </label>
        </div>
      </div>

      <hr class="passage-notes-query-manager__divider">

      <div class="mbl-field">
        <label class="mbl-label">{{ $t('sort') }}</label>
        <div class="mbl-control">
          <label class="mbl-radio">
            <input v-model="draftSort" type="radio" value="createdAt:descending" data-testid="notes-query-sort-newest">
            {{ $t('sort_newest_first') }}
          </label>
        </div>
        <div class="mbl-control">
          <label class="mbl-radio">
            <input v-model="draftSort" type="radio" value="createdAt:ascending" data-testid="notes-query-sort-oldest">
            {{ $t('sort_oldest_first') }}
          </label>
        </div>
      </div>

      <hr class="passage-notes-query-manager__divider">

      <div class="mbl-field">
        <label class="mbl-label">{{ $t('page_size') }}</label>
        <div class="mbl-control">
          <div class="mbl-select">
            <select :value="draft.limit" data-testid="notes-query-page-size" @change="setDraft({ limit: Number($event.target.value) })">
              <option :value="10">
                10
              </option>
              <option :value="20">
                20
              </option>
              <option :value="50">
                50
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="passage-notes-query-manager__actions">
        <button class="mbl-button mbl-button--primary" type="button" data-testid="notes-query-apply" :disabled="!isDirty" @click="applyDraft">
          {{ $t('apply') }}
        </button>
        <button class="mbl-button mbl-button--light" type="button" data-testid="notes-query-cancel" :disabled="!isDirty" @click="cancelDraft">
          {{ $t('cancel') }}
        </button>
      </div>
    </div>

    <passage-notes-tag-filter-modal
      :open="showTagFilterModal"
      :passage-note-tags="passageNoteTags"
      :selected-tag-ids="draft.filterTags"
      @change="onTagIdsChange"
      @close="closeTagFilterModal"
    />
  </div>
</template>

<script>
import VerseInput from '@/components/forms/VerseInput';
import PassageNotesTagFilterModal from '@/components/popups/PassageNotesTagFilterModal';
import { useDialogStore } from '~/stores/dialog';

const DEFAULT_DRAFT = {
  limit: 10,
  sortOn: 'createdAt',
  sortDirection: 'descending',
  filterTags: [],
  filterTagMatching: 'any',
  searchText: '',
  filterPassageStartVerseId: 0,
  filterPassageEndVerseId: 0,
  filterPassageMatching: 'inclusive',
};

function pickManagedQuery(query) {
  const q = query || {};
  return {
    limit: q.limit ?? DEFAULT_DRAFT.limit,
    sortOn: q.sortOn ?? DEFAULT_DRAFT.sortOn,
    sortDirection: q.sortDirection ?? DEFAULT_DRAFT.sortDirection,
    filterTags: Array.isArray(q.filterTags) ? [...q.filterTags] : [...DEFAULT_DRAFT.filterTags],
    filterTagMatching: q.filterTagMatching ?? DEFAULT_DRAFT.filterTagMatching,
    searchText: q.searchText ?? DEFAULT_DRAFT.searchText,
    filterPassageStartVerseId: q.filterPassageStartVerseId ?? DEFAULT_DRAFT.filterPassageStartVerseId,
    filterPassageEndVerseId: q.filterPassageEndVerseId ?? DEFAULT_DRAFT.filterPassageEndVerseId,
    filterPassageMatching: q.filterPassageMatching ?? DEFAULT_DRAFT.filterPassageMatching,
  };
}

function deepEqualManaged(a, b) {
  const aa = pickManagedQuery(a);
  const bb = pickManagedQuery(b);
  return JSON.stringify(aa) === JSON.stringify(bb);
}

export default {
  name: 'PassageNotesQueryManager',
  components: {
    VerseInput,
    PassageNotesTagFilterModal,
  },
  props: {
    appliedQuery: {
      type: Object,
      default: () => ({}),
    },
    passageNoteTags: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    const baseline = pickManagedQuery(this.appliedQuery);
    return {
      baseline,
      draft: pickManagedQuery(this.appliedQuery),
      showTagFilterModal: false,
    };
  },
  computed: {
    isDirty() {
      return !deepEqualManaged(this.draft, this.baseline);
    },
    hasSelectedTags() {
      return Array.isArray(this.draft.filterTags) && this.draft.filterTags.length > 0;
    },
    selectedTags() {
      const selectedIds = Array.isArray(this.draft.filterTags) ? this.draft.filterTags : [];
      const byId = new Map((this.passageNoteTags || []).map(t => [t.id, t]));
      return selectedIds
        .map(id => byId.get(id) || { id, label: `${id}`, color: 'var(--mbl-bg-disabled)' })
        .filter(Boolean);
    },
    hasSelectedPassage() {
      return !!(this.draft.filterPassageStartVerseId && this.draft.filterPassageEndVerseId);
    },
    passageRangeModel: {
      get() {
        const startVerseId = Number(this.draft.filterPassageStartVerseId || 0);
        const endVerseId = Number(this.draft.filterPassageEndVerseId || 0);
        if (!startVerseId || !endVerseId) { return null; }
        return { startVerseId, endVerseId };
      },
      set(range) {
        if (!range) {
          this.setDraft({ filterPassageStartVerseId: 0, filterPassageEndVerseId: 0 });
          return;
        }
        this.setDraft({
          filterPassageStartVerseId: Number(range.startVerseId),
          filterPassageEndVerseId: Number(range.endVerseId),
        });
      },
    },
    onlyUntaggedNotes: {
      get() {
        return this.draft.filterTagMatching === 'exact' &&
          Array.isArray(this.draft.filterTags) &&
          this.draft.filterTags.length === 0;
      },
      set(enabled) {
        if (enabled) {
          this.setDraft({ filterTags: [], filterTagMatching: 'exact' });
          return;
        }
        if (this.draft.filterTagMatching === 'exact' && (!this.draft.filterTags || this.draft.filterTags.length === 0)) {
          this.setDraft({ filterTagMatching: 'any' });
        }
      },
    },
    draftSort: {
      get() {
        return `${this.draft.sortOn}:${this.draft.sortDirection}`;
      },
      set(value) {
        const [sortOn, sortDirection] = (value || '').split(':');
        this.setDraft({ sortOn, sortDirection });
      },
    },
  },
  watch: {
    appliedQuery: {
      deep: true,
      handler(nextAppliedQuery) {
        if (this.isDirty) { return; }
        this.baseline = pickManagedQuery(nextAppliedQuery);
        this.draft = pickManagedQuery(nextAppliedQuery);
      },
    },
  },
  methods: {
    setDraft(update) {
      this.draft = { ...this.draft, ...update };
    },
    openTagFilterModal() {
      this.showTagFilterModal = true;
    },
    closeTagFilterModal() {
      this.showTagFilterModal = false;
    },
    clearTagSelection() {
      this.setDraft({ filterTags: [], filterTagMatching: 'any' });
    },
    onTagIdsChange(tagIds) {
      const nextTagIds = Array.isArray(tagIds) ? tagIds : [];
      const hadNoTags = !Array.isArray(this.draft.filterTags) || this.draft.filterTags.length === 0;
      if (nextTagIds.length && this.draft.filterTagMatching === 'exact' && hadNoTags) {
        this.setDraft({ filterTags: nextTagIds, filterTagMatching: 'any' });
        return;
      }
      this.setDraft({ filterTags: nextTagIds });
    },
    resetDraftToApplied() {
      this.baseline = pickManagedQuery(this.appliedQuery);
      this.draft = pickManagedQuery(this.appliedQuery);
    },
    async confirmAndReset() {
      const dialogStore = useDialogStore();
      const confirmed = await dialogStore.confirm({ message: this.$t('reset_confirm') });
      if (!confirmed) { return; }

      const update = pickManagedQuery(JSON.parse(JSON.stringify(DEFAULT_DRAFT)));
      this.baseline = pickManagedQuery(update);
      this.draft = pickManagedQuery(update);
      this.$emit('apply', update);
    },
    applyDraft() {
      const update = pickManagedQuery(this.draft);
      this.baseline = pickManagedQuery(update);
      this.draft = pickManagedQuery(update);
      this.$emit('apply', update);
    },
    cancelDraft() {
      this.resetDraftToApplied();
      this.$emit('cancel');
    },
  },
};
</script>

<style scoped>
.passage-notes-query-manager__divider {
  margin: 1rem 0;
}

.passage-notes-query-manager__tag-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.passage-notes-query-manager__selected-tags {
  margin-bottom: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.passage-notes-query-manager__selected-tag {
  display: inline-flex;
  align-items: center;
  position: relative;
  gap: 0.35rem;
  max-width: 100%;

  font-size: 0.85rem;
  line-height: 1.2;
  padding: 0.15rem 0.5rem 0.15rem 0.45rem;
  border-radius: 0.25rem;

  color: var(--mbl-text);
  background: var(--mbl-tag-option-bg);
  border: 1px solid var(--mbl-tag-option-border);

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.passage-notes-query-manager__selected-tag::before {
  content: '';
  width: 0.45rem;
  height: 0.8rem;
  border-radius: 999px;
  background: var(--tag-color);
  flex: 0 0 auto;
}

.passage-notes-query-manager__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.passage-notes-query-manager__passage-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.passage-notes-query-manager__radio-option {
  display: grid;
  grid-template-columns: 1.25rem 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.35rem;
  row-gap: 0.1rem;
  align-items: start;
}

.passage-notes-query-manager__radio-option input {
  grid-column: 1;
  grid-row: 1 / span 2;
  margin-top: 0.2rem;
}

.passage-notes-query-manager__radio-title {
  grid-column: 2;
  grid-row: 1;
}

.passage-notes-query-manager__radio-help {
  grid-column: 2;
  grid-row: 2;
  font-size: 0.9em;
  color: var(--mbl-text-85);
}
</style>

<i18n lang="json">
{
  "en": {
    "title": "View Options",
    "reset": "Reset",
    "reset_confirm": "Are you sure you want to reset search/filter/sort settings?",
    "search_text": "Search Text",
    "search_placeholder": "Enter text…",
    "tag_filters": "Filter by Tags",
    "tag_select": {
      "choose": "Choose tags…",
      "clear": "Clear tags"
    },
    "tag_only_untagged": "Only untagged notes",
    "tag_match": "Match",
    "tag_match_any": "Any",
    "tag_match_all": "All",
    "tag_match_exact": "Exact",
    "passage": "Filter by Passage",
    "clear": "Clear",
    "passage_match": "Match",
    "passage_match_inclusive": "Inclusive",
    "passage_match_exclusive": "Exclusive",
    "passage_match_inclusive_description": "Matches a note if any of its verses overlap your filter passage.",
    "passage_match_exclusive_description": "Matches a note if any of its verses are within your filter passage.",
    "sort": "Sort",
    "sort_newest_first": "Newest First",
    "sort_oldest_first": "Oldest First",
    "page_size": "Page Size",
    "apply": "Apply",
    "cancel": "Cancel"
  },
  "de": {
    "title": "Ansichtsoptionen",
    "reset": "Zurücksetzen",
    "reset_confirm": "Möchten Sie die Such-/Filter-/Sortiereinstellungen wirklich zurücksetzen?",
    "search_text": "Suchtext",
    "search_placeholder": "Text eingeben…",
    "tag_filters": "Nach Tags filtern",
    "tag_select": {
      "choose": "Tags auswählen…",
      "clear": "Tags löschen"
    },
    "tag_only_untagged": "Nur ungetaggte Notizen",
    "tag_match": "Übereinstimmung",
    "tag_match_any": "Beliebig",
    "tag_match_all": "Alle",
    "tag_match_exact": "Exakt",
    "passage": "Nach Passage filtern",
    "clear": "Löschen",
    "passage_match": "Übereinstimmung",
    "passage_match_inclusive": "Inklusiv",
    "passage_match_exclusive": "Exklusiv",
    "passage_match_inclusive_description": "Stimmt mit einer Notiz überein, wenn sich einer ihrer Verse mit Ihrer Filterpassage überschneidet.",
    "passage_match_exclusive_description": "Stimmt mit einer Notiz überein, wenn einer ihrer Verse innerhalb Ihrer Filterpassage liegt.",
    "sort": "Sortieren",
    "sort_newest_first": "Neueste zuerst",
    "sort_oldest_first": "Älteste zuerst",
    "page_size": "Seitengröße",
    "apply": "Anwenden",
    "cancel": "Abbrechen"
  },
  "es": {
    "title": "Opciones de vista",
    "reset": "Restablecer",
    "reset_confirm": "¿Está seguro de que desea restablecer la búsqueda / filtros / orden?",
    "search_text": "Texto de búsqueda",
    "search_placeholder": "Ingrese texto…",
    "tag_filters": "Filtrar por etiquetas",
    "tag_select": {
      "choose": "Elegir etiquetas…",
      "clear": "Limpiar etiquetas"
    },
    "tag_only_untagged": "Solo notas sin etiquetas",
    "tag_match": "Partido",
    "tag_match_any": "Cualquier",
    "tag_match_all": "Todas",
    "tag_match_exact": "Exacto",
    "passage": "Filtrar por pasaje",
    "clear": "Limpiar",
    "passage_match": "Partido",
    "passage_match_inclusive": "Inclusivo",
    "passage_match_exclusive": "Exclusivo",
    "passage_match_inclusive_description": "Coincide con una nota si alguno de sus versículos se superpone a su pasaje de filtro.",
    "passage_match_exclusive_description": "Coincide con una nota si alguno de sus versículos está dentro de su pasaje de filtro.",
    "sort": "Ordenar",
    "sort_newest_first": "Más reciente primero",
    "sort_oldest_first": "Más antiguo primero",
    "page_size": "Tamaño de página",
    "apply": "Aplicar",
    "cancel": "Cancelar"
  },
  "fr": {
    "title": "Options d’affichage",
    "reset": "Réinitialiser",
    "reset_confirm": "Êtes-vous sûr de vouloir réinitialiser la recherche / les filtres / le tri ?",
    "search_text": "Rechercher un texte",
    "search_placeholder": "Entrez le texte…",
    "tag_filters": "Filtrer par tags",
    "tag_select": {
      "choose": "Choisir des étiquettes…",
      "clear": "Effacer les étiquettes"
    },
    "tag_only_untagged": "Uniquement les notes sans tags",
    "tag_match": "Correspondance",
    "tag_match_any": "Tous",
    "tag_match_all": "Tout",
    "tag_match_exact": "Exact",
    "passage": "Filtrer par passage",
    "clear": "Effacer",
    "passage_match": "Correspondance",
    "passage_match_inclusive": "Inclusif",
    "passage_match_exclusive": "Exclusif",
    "passage_match_inclusive_description": "Correspond si l’un de ses versets chevauche votre passage de filtre.",
    "passage_match_exclusive_description": "Correspond si l’un de ses versets se trouve dans votre passage de filtre.",
    "sort": "Trier",
    "sort_newest_first": "Le plus récent d'abord",
    "sort_oldest_first": "Plus ancien en premier",
    "page_size": "Taille de page",
    "apply": "Appliquer",
    "cancel": "Annuler"
  },
  "ko": {
    "title": "보기 옵션",
    "reset": "초기화",
    "reset_confirm": "검색·필터·정렬 설정을 초기화할까요?",
    "search_text": "검색어",
    "search_placeholder": "텍스트 입력…",
    "tag_filters": "태그 필터",
    "tag_select": {
      "choose": "태그 선택…",
      "clear": "태그 지우기"
    },
    "tag_only_untagged": "태그 없는 노트만",
    "tag_match": "일치 옵션",
    "tag_match_any": "하나라도 일치",
    "tag_match_all": "모두 일치",
    "tag_match_exact": "정확히 일치",
    "passage": "범위 필터",
    "clear": "지우기",
    "passage_match": "일치 옵션",
    "passage_match_inclusive": "포함",
    "passage_match_exclusive": "제외",
    "passage_match_inclusive_description": "필터 구절과 한 절이라도 겹치는 노트를 찾습니다.",
    "passage_match_exclusive_description": "필터 구절 범위 내 노트를 찾습니다.",
    "sort": "정렬",
    "sort_newest_first": "최신순",
    "sort_oldest_first": "오래된순",
    "page_size": "페이지 크기",
    "apply": "적용",
    "cancel": "취소"
  },
  "pt": {
    "title": "Opções de visualização",
    "reset": "Reiniciar",
    "reset_confirm": "Tem certeza de que deseja reiniciar as configurações de busca / filtro / ordenação?",
    "search_text": "Pesquisar Texto",
    "search_placeholder": "Digite o texto…",
    "tag_filters": "Filtrar por tags",
    "tag_select": {
      "choose": "Escolher tags…",
      "clear": "Limpar tags"
    },
    "tag_only_untagged": "Apenas notas sem tags",
    "tag_match": "Corresponder",
    "tag_match_any": "Qualquer",
    "tag_match_all": "Tudo",
    "tag_match_exact": "Exato",
    "passage": "Filtrar por passagem",
    "clear": "Limpar",
    "passage_match": "Corresponder",
    "passage_match_inclusive": "Inclusivo",
    "passage_match_exclusive": "Exclusivo",
    "passage_match_inclusive_description": "Corresponde se algum de seus versículos se sobrepõe à sua passagem de filtro.",
    "passage_match_exclusive_description": "Corresponde se algum de seus versículos está dentro da sua passagem de filtro.",
    "sort": "Ordenar",
    "sort_newest_first": "Mais Recentes Primeiro",
    "sort_oldest_first": "Mais Antigos Primeiro",
    "page_size": "Tamanho da página",
    "apply": "Aplicar",
    "cancel": "Cancelar"
  },
  "uk": {
    "title": "Параметри перегляду",
    "reset": "Скинути",
    "reset_confirm": "Ви впевнені, що хочете скинути налаштування пошуку / фільтра / сортування?",
    "search_text": "Текст для пошуку",
    "search_placeholder": "Введіть текст…",
    "tag_filters": "Фільтрувати за тегами",
    "tag_select": {
      "choose": "Вибрати теги…",
      "clear": "Очистити теги"
    },
    "tag_only_untagged": "Лише нотатки без тегів",
    "tag_match": "Співпадіння",
    "tag_match_any": "Будь-який",
    "tag_match_all": "Всі",
    "tag_match_exact": "Точний",
    "passage": "Фільтрувати за уривком",
    "clear": "Очистити",
    "passage_match": "Співпадіння",
    "passage_match_inclusive": "Включно",
    "passage_match_exclusive": "Виключно",
    "passage_match_inclusive_description": "Збігається, якщо будь-який її вірш перетинається з вашим фільтрованим уривком.",
    "passage_match_exclusive_description": "Збігається, якщо будь-який її вірш знаходиться всередині вашого фільтрованого уривка.",
    "sort": "Сортувати",
    "sort_newest_first": "Спочатку нові",
    "sort_oldest_first": "Спочатку старі",
    "page_size": "Розмір сторінки",
    "apply": "Застосувати",
    "cancel": "Скасувати"
  }
}
</i18n>
