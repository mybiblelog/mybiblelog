<template>
  <app-modal :open="open" :title="t('manage_tags')" @close="cancel">
    <template #content>
      <div :class="{ 'manage-tags__disabled': tagEditorOpen }">
        <passage-note-tag-selector
          :passage-note-tags="passageNoteTags"
          :selected-tag-ids="selectedTagIds"
          @change="updateSelectedTagIds"
        />

        <div class="manage-tags__new-row">
          <button
            class="mbl-button mbl-button--sm mbl-button--primary"
            type="button"
            data-testid="note-editor-create-tag"
            @click="openNewTagEditor"
          >
            {{ t('new') }}
          </button>
        </div>
      </div>
    </template>

    <template #footer>
      <button class="mbl-button mbl-button--primary" type="button" :disabled="tagEditorOpen" @click="done">
        {{ t('done') }}
      </button>
      <button class="mbl-button mbl-button--light" type="button" :disabled="tagEditorOpen" @click="cancel">
        {{ t('close') }}
      </button>
    </template>
  </app-modal>
</template>

<script setup lang="ts">
import AppModal from '~/components/popups/AppModal.vue';
import PassageNoteTagSelector from '~/components/forms/PassageNoteTagSelector.vue';
import { usePassageNoteTagEditorStore } from '~/stores/passage-note-tag-editor';

type TagOption = { id: string | number; label?: string; color?: string; [key: string]: unknown };

const props = withDefaults(defineProps<{
  open?: boolean;
  passageNoteTags?: TagOption[];
  selectedTagIds?: Array<string | number>;
}>(), {
  open: false,
  passageNoteTags: () => [],
  selectedTagIds: () => [],
});

const emit = defineEmits<{
  change: [tagIds: Array<string | number>];
  done: [tagIds: Array<string | number>];
  cancel: [];
}>();

const { t } = useI18n();
const tagEditorStore = usePassageNoteTagEditorStore();

const pendingCreateTag = ref(false);
const baselineTagIds = ref<Array<string | number>>([]);

const tagEditorOpen = computed(() => tagEditorStore.open);

watch(tagEditorOpen, (next, prev) => {
  if (prev && !next && pendingCreateTag.value) {
    pendingCreateTag.value = false;
    selectNewlyCreatedTagIfAny();
  }
});

function updateSelectedTagIds(tagIds: Array<string | number>) {
  emit('change', tagIds);
}

function openNewTagEditor() {
  baselineTagIds.value = (props.passageNoteTags ?? []).map(tag => tag.id);
  pendingCreateTag.value = true;
  tagEditorStore.openEditor(null);
}

function selectNewlyCreatedTagIfAny() {
  const currentIds = new Set((props.passageNoteTags ?? []).map(tag => tag.id));
  const baseline = new Set(baselineTagIds.value ?? []);
  const addedIds = [...currentIds].filter(id => !baseline.has(id));

  if (addedIds.length !== 1) {
    baselineTagIds.value = [];
    return;
  }

  const createdId = addedIds[0]!;
  const nextIds = [...(props.selectedTagIds ?? [])];
  if (!nextIds.includes(createdId)) {
    nextIds.push(createdId);
    emit('change', nextIds);
  }
  baselineTagIds.value = [];
}

function done() {
  emit('done', props.selectedTagIds ?? []);
}

function cancel() {
  pendingCreateTag.value = false;
  baselineTagIds.value = [];
  emit('cancel');
}
</script>

<style scoped>
.manage-tags__new-row {
  margin-top: 0.75rem;
}

.manage-tags__disabled {
  pointer-events: none;
  opacity: 0.6;
}
</style>

<i18n lang="json">
{
  "en": { "manage_tags": "Choose Tags", "new": "Create Tag", "done": "Done", "close": "Close" },
  "de": { "manage_tags": "Tags auswählen", "new": "Tag erstellen", "done": "Fertig", "close": "Schließen" },
  "es": { "manage_tags": "Elegir etiquetas", "new": "Crear etiqueta", "done": "Hecho", "close": "Cerrar" },
  "fr": { "manage_tags": "Choisir des étiquettes", "new": "Créer une étiquette", "done": "Terminé", "close": "Fermer" },
  "ko": { "manage_tags": "태그 선택", "new": "태그 생성", "done": "완료", "close": "닫기" },
  "pt": { "manage_tags": "Escolher Tags", "new": "Criar tag", "done": "Concluído", "close": "Fechar" },
  "uk": { "manage_tags": "Вибрати теги", "new": "Створити тег", "done": "Готово", "close": "Закрити" }
}
</i18n>
