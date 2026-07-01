<template>
  <div class="passage-note-tag-selector">
    <div class="passage-note-tag-selector__grid">
      <label
        v-for="tag in selectorTags"
        :key="tag.id"
        class="passage-note-tag-option"
        :class="{ 'passage-note-tag-option--selected': tag.selected }"
        :style="passageNoteTagStyle(tag)"
      >
        <input
          type="checkbox"
          :checked="tag.selected"
          @change="toggle(tag.id)"
        >
        <span class="passage-note-tag-option__label">{{ tag.label }}</span>
      </label>
      <em v-if="!selectorTags.length" class="passage-note-tag-selector__empty">
        {{ t('create_a_tag_to_select_it_here') }}
      </em>
    </div>
  </div>
</template>

<script setup lang="ts">
type TagOption = { id: string | number; label?: string; color?: string; [key: string]: unknown };

const props = withDefaults(defineProps<{
  passageNoteTags?: TagOption[];
  selectedTagIds?: Array<string | number>;
}>(), {
  passageNoteTags: () => [],
  selectedTagIds: () => [],
});

const emit = defineEmits<{ change: [tagIds: Array<string | number>] }>();

const { t } = useI18n();

const selectorTags = computed(() =>
  (props.passageNoteTags ?? []).map(tag => ({
    ...tag,
    selected: (props.selectedTagIds ?? []).includes(tag.id),
  })),
);

function passageNoteTagStyle(tag: TagOption) {
  return { '--tag-color': tag?.color || 'var(--mbl-bg-disabled)' };
}

function toggle(tagId: string | number) {
  const selected = new Set(props.selectedTagIds ?? []);
  if (selected.has(tagId)) {
    selected.delete(tagId);
  }
  else {
    selected.add(tagId);
  }
  // Preserve the tag order from the source list.
  const next = (props.passageNoteTags ?? [])
    .map(tag => tag.id)
    .filter(id => selected.has(id));
  emit('change', next);
}
</script>

<style scoped>
.passage-note-tag-selector {
  /* stylelint-disable-next-line property-no-unknown */
  container-type: inline-size;
  max-width: 100%;
}

.passage-note-tag-selector__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem;
  max-width: 100%;
}

/* stylelint-disable-next-line at-rule-no-unknown */
@container (max-width: 300px) {
  .passage-note-tag-selector__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.passage-note-tag-selector__empty {
  grid-column: 1 / -1;
}

.passage-note-tag-option {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  position: relative;
  cursor: pointer;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  color: var(--mbl-text);
  background: var(--mbl-tag-option-bg);
  border: 1px solid var(--mbl-tag-option-border);
  padding: 0.25rem 0.6rem 0.25rem 0.5rem;
  border-radius: 0.25rem;
  -webkit-user-select: none;
  user-select: none;
}

.passage-note-tag-option input[type='checkbox'] {
  flex: 0 0 auto;
}

.passage-note-tag-option::before {
  content: '';
  width: 0.45rem;
  height: 0.85rem;
  border-radius: 999px;
  background: var(--tag-color);
  flex: 0 0 auto;
}

.passage-note-tag-option__label {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.passage-note-tag-option--selected {
  background: var(--mbl-tag-option-selected-bg);
}
</style>

<i18n lang="json">
{
  "en": { "create_a_tag_to_select_it_here": "Create a tag to select it here." },
  "de": { "create_a_tag_to_select_it_here": "Erstellen Sie ein Tag, um es hier auszuwählen." },
  "es": { "create_a_tag_to_select_it_here": "Crea una etiqueta para seleccionarla aquí." },
  "fr": { "create_a_tag_to_select_it_here": "Créez une étiquette pour la sélectionner ici." },
  "ko": { "create_a_tag_to_select_it_here": "태그를 만든 뒤 여기서 선택할 수 있습니다." },
  "pt": { "create_a_tag_to_select_it_here": "Crie uma tag para selecioná-la aqui." },
  "uk": { "create_a_tag_to_select_it_here": "Створіть тег, щоб вибрати його тут." }
}
</i18n>
