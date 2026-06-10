<template>
  <form @submit.prevent="handleSubmit">
    <div v-if="errors._form" class="mbl-help mbl-help--danger">
      <div class="mbl-help mbl-help--danger">
        {{ $terr(errors._form) }}
      </div>
    </div>
    <div class="mbl-field">
      <div class="mbl-label">
        {{ $t('label') }}
      </div>
      <div v-if="errors.label" class="mbl-help mbl-help--danger">
        {{ $terr(errors.label, { field: $t('label') }) }}
      </div>
      <div class="mbl-control">
        <input
          :value="passageNoteTag.label"
          class="mbl-input"
          type="text"
          maxlength="32"
          data-testid="tag-editor-label"
          @input="updateLabel"
        >
      </div>
    </div>
    <div class="mbl-field">
      <div class="mbl-label">
        {{ $t('color') }}
      </div>
      <div class="mbl-control">
        <input :value="passageNoteTag.color" class="mbl-input" type="color" data-testid="tag-editor-color" @input="updateColor">
      </div>
    </div>
    <div class="mbl-field">
      <div class="mbl-label">
        {{ $t('description') }}
      </div>
      <div class="mbl-control">
        <textarea :value="passageNoteTag.description" class="mbl-textarea" maxlength="1500" data-testid="tag-editor-description" @input="updateDescription" />
      </div>
    </div>
    <!-- ensures property will be computed because it is accessed-->
    <p hidden="hidden">
      {{ isValid }}
    </p>
  </form>
</template>

<script>
import { usePassageNoteTagEditorStore } from '~/stores/passage-note-tag-editor';

export default {
  name: 'PassageNoteTagEditorForm',
  computed: {
    passageNoteTagEditorStore() {
      return usePassageNoteTagEditorStore();
    },
    passageNoteTag() {
      return this.passageNoteTagEditorStore.passageNoteTag;
    },
    errors() {
      return this.passageNoteTagEditorStore.errors;
    },
    isValid() {
      const valid = this.validatePassageNoteTag(this.passageNoteTag);
      this.passageNoteTagEditorStore.setValid(valid);
      return valid;
    },
  },
  methods: {
    validatePassageNoteTag(passageNoteTag) {
      if (passageNoteTag.label.trim().length < 1 || passageNoteTag.label.length > 32) {
        return false;
      }
      if (!/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(passageNoteTag.color)) {
        return false;
      }
      return true;
    },
    updateLabel(event) {
      const updatedPassageNoteTag = JSON.parse(JSON.stringify(this.passageNoteTag));
      updatedPassageNoteTag.label = event.target.value;
      this.passageNoteTagEditorStore.updatePassageNoteTag(updatedPassageNoteTag);
    },
    updateColor(event) {
      const updatedPassageNoteTag = JSON.parse(JSON.stringify(this.passageNoteTag));
      updatedPassageNoteTag.color = event.target.value;
      this.passageNoteTagEditorStore.updatePassageNoteTag(updatedPassageNoteTag);
    },
    updateDescription(event) {
      const updatedPassageNoteTag = JSON.parse(JSON.stringify(this.passageNoteTag));
      updatedPassageNoteTag.description = event.target.value;
      this.passageNoteTagEditorStore.updatePassageNoteTag(updatedPassageNoteTag);
    },
    handleSubmit() {
      this.passageNoteTagEditorStore.savePassageNoteTag();
    },
  },
};
</script>

<style scoped>

</style>

<i18n lang="json">
{
  "en": {
    "label": "Label",
    "color": "Color",
    "description": "Description"
  },
  "de": {
    "label": "Label",
    "color": "Farbe",
    "description": "Beschreibung"
  },
  "es": {
    "label": "Etiqueta",
    "color": "Color",
    "description": "Descripción"
  },
  "fr": {
    "label": "Étiquette",
    "color": "Couleur",
    "description": "Description"
  },
  "ko": {
    "label": "태그 이름",
    "color": "색상",
    "description": "설명"
  },
  "pt": {
    "label": "Nome",
    "color": "Cor",
    "description": "Descrição"
  },
  "uk": {
    "label": "Мітка",
    "color": "Колір",
    "description": "Опис"
  }
}
</i18n>
