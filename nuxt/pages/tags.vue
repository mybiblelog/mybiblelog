<template>
  <main>
    <div class="content-column">
      <header class="page-header">
        <h2 class="mbl-title">
          {{ $t('note_tags') }}
          <info-link :to="localePath('/about/page-features--notes')" />
        </h2>
        <div class="mbl-button-group mbl-button-group--start">
          <nuxt-link class="mbl-button" :to="localePath('/notes')">
            {{ $t('notes') }}
            <caret-right-icon style="margin-left: 0.2rem;" />
          </nuxt-link>
          <button class="mbl-button mbl-button--primary" data-testid="tag-new" @click="openPassageNoteTagEditor()">
            {{ $t('new') }}
          </button>
        </div>
      </header>
      <div class="tag-sort-row">
        <div class="mbl-field mbl-field--addons">
          <div class="mbl-control">
            <span class="mbl-button mbl-button--static">{{ $t('sort_by') }}</span>
          </div>
          <div class="mbl-control">
            <div class="mbl-select">
              <select v-model="sortOrder" data-testid="tag-sort-order">
                <option value="label:ascending">
                  {{ $t('sort_az') }}
                </option>
                <option value="createdAt:descending">
                  {{ $t('sort_newest_first') }}
                </option>
                <option value="createdAt:ascending">
                  {{ $t('sort_oldest_first') }}
                </option>
                <option value="noteCount:descending">
                  {{ $t('sort_most_notes') }}
                </option>
                <option value="noteCount:ascending">
                  {{ $t('sort_fewest_notes') }}
                </option>
                <option value="color:hue">
                  {{ $t('sort_color') }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div v-for="tag in passageNoteTags" :key="tag.id" class="tag-line" data-testid="tag-line">
          <div>
            <div class="passage-note-tag" data-testid="tag-label" :style="passageNoteTagStyle(tag)">
              {{ tag.label }}
            </div>
            <div class="tag-description">
              <hyperlinked-text :text="tag.description" />
            </div>
          </div>
          <div class="tag-footer">
            <div v-if="displayTagTimeSince(tag)" class="tag-footer--created">
              <span class="mbl-text-muted mbl-text-small" :title="displayTagDateTime(tag)">{{ $t('created') }} {{ displayTagTimeSince(tag) }}</span>
            </div>
            <div class="mbl-button-group mbl-button-group--end tag-footer--buttons">
              <button class="mbl-button mbl-button--sm" data-testid="tag-notes-count" :data-note-count="tag.noteCount" @click="viewTagNotes(tag)">
                {{ $t('notes_count', { count: tag.noteCount }) }}
              </button>
              <button class="mbl-button mbl-button--sm" data-testid="tag-edit" @click="openPassageNoteTagEditor(tag)">
                {{ $t('edit') }}
              </button>
              <button class="mbl-button mbl-button--sm" data-testid="tag-delete" @click="deletePassageNoteTag(tag.id)">
                {{ $t('delete') }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="!passageNoteTags.length" class="tag-line">
          <div class="mbl-text-center">
            {{ $t('no_tags') }}
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { displayDateTime, displayTimeSince } from '@mybiblelog/shared';
import { encodePassageNotesQueryToRoute } from '@/helpers/passage-notes-route-query';
import HyperlinkedText from '@/components/HyperlinkedText';
import InfoLink from '@/components/InfoLink';
import CaretRightIcon from '@/components/svg/CaretRightIcon';
import { useDialogStore } from '~/stores/dialog';
import { useToastStore } from '~/stores/toast';
import { usePassageNoteTagEditorStore } from '~/stores/passage-note-tag-editor';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

export default {
  name: 'NoteTagsListPage',
  components: {
    HyperlinkedText,
    InfoLink,
    CaretRightIcon,
  },
  middleware: ['auth'],
  head() {
    return {
      title: this.$t('note_tags'),
    };
  },
  computed: {
    passageNoteTagsStore() {
      return usePassageNoteTagsStore();
    },
    passageNoteTags() {
      return this.passageNoteTagsStore.passageNoteTags;
    },
    sortOrder: {
      get() {
        return this.passageNoteTagsStore.sortOrder;
      },
      set(value) {
        this.passageNoteTagsStore.setPassageNoteTagSortOrder({ sortOrder: value, persist: true });
      },
    },
  },
  mounted() {
    this.passageNoteTagsStore.loadPassageNoteTags();
  },
  methods: {
    tagCreatedAtDate(tag) {
      const ms = this.passageNoteTagsStore.tagCreatedAtMs(tag);
      return ms ? new Date(ms) : null;
    },
    displayTagDateTime(tag) {
      const date = this.tagCreatedAtDate(tag);
      if (!date) { return ''; }
      return displayDateTime(date, this.$i18n.locale);
    },
    displayTagTimeSince(tag) {
      const date = this.tagCreatedAtDate(tag);
      if (!date) { return ''; }
      return displayTimeSince(date, this.$i18n.locale);
    },
    viewTagNotes(tag) {
      const query = encodePassageNotesQueryToRoute({ filterTags: [tag.id], offset: 0 });
      this.$router.push({ path: this.localePath('/notes'), query });
    },
    openPassageNoteTagEditor(passageNoteTag = null) {
      usePassageNoteTagEditorStore().openEditor(passageNoteTag);
    },
    async deletePassageNoteTag(id) {
      const dialogStore = useDialogStore();
      const toastStore = useToastStore();
      if (this.passageNoteTags.find(tag => tag.id === id).noteCount > 0) {
        await dialogStore.alert({ message: this.$t('cannot_delete_tag_in_use') });
        return;
      }
      const confirmed = await dialogStore.confirm({
        message: this.$t('confirm_delete_tag'),
        confirmButtonType: 'danger',
      });
      if (!confirmed) { return; }

      const success = await this.passageNoteTagsStore.deletePassageNoteTag(id);
      if (!success) {
        toastStore.add({
          type: 'error',
          text: this.$t('tag_not_deleted'),
        });
      }
    },
    passageNoteTagStyle(tag) {
      return {
        'background-color': tag.color,
      };
    },
  },
};
</script>

<style scoped>
.tag-sort-row {
  margin: 0.25rem 0 1rem;
}
.tag-line {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  margin: 1rem -0.5rem;
  background: var(--mbl-bg);
  border-radius: 0.25rem;
  box-shadow: var(--mbl-card-shadow);
}
.tag-footer {
  margin-top: 0.25rem;
  padding: 0 0.5rem;

  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: "created buttons";
  align-items: center;
  gap: 0 0.5rem;
}
.tag-footer--created {
  grid-area: created;
  justify-self: start;
}
.tag-footer--buttons {
  grid-area: buttons;
  justify-self: end;
  margin-bottom: 0;
}
.tag-footer--buttons.buttons {
  margin-bottom: 0;
}

@media (max-width: 520px) {
  .tag-footer {
    grid-template-columns: 1fr;
    grid-template-areas:
      "buttons"
      "created";
  }
  .tag-footer--created {
    justify-self: end;
  }
}
.passage-note-tag {
  color: var(--mbl-on-accent);
  text-shadow: 0 0 2px var(--mbl-text-stronger);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  overflow-x: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tag-description {
  white-space: pre-wrap;
  margin: 0.5rem 0;
  padding: 0 0.5rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "note_tags": "Note Tags",
    "notes": "Notes",
    "new": "New",
    "edit": "Edit",
    "delete": "Delete",
    "no_tags": "No Tags",
    "sort_by": "Sort",
    "sort_az": "A-Z",
    "sort_newest_first": "Newest First",
    "sort_oldest_first": "Oldest First",
    "sort_most_notes": "Most Notes",
    "sort_fewest_notes": "Fewest Notes",
    "sort_color": "Color",
    "created": "Created",
    "label": "Label",
    "color": "Color",
    "description": "Description",
    "save": "Save",
    "close": "Close",
    "notes_count": "Notes: {count}",
    "edit_tag": "Edit Tag",
    "add_tag": "Add Tag",
    "confirm_delete_tag": "Are you sure you want to delete this tag?",
    "cannot_delete_tag_in_use": "Cannot delete a tag that is still being used by notes.",
    "tag_deleted": "The tag was deleted.",
    "tag_not_deleted": "The tag could not be deleted.",
    "unknown_error": "An unknown error occurred."
  },
  "de": {
    "note_tags": "Notiz-Tags",
    "notes": "Notizen",
    "new": "Neu",
    "edit": "Bearbeiten",
    "delete": "Löschen",
    "no_tags": "Keine Notiz-Tags",
    "sort_by": "Sortieren",
    "sort_az": "A-Z",
    "sort_newest_first": "Neueste zuerst",
    "sort_oldest_first": "Älteste zuerst",
    "sort_most_notes": "Meiste Notizen",
    "sort_fewest_notes": "Wenigste Notizen",
    "sort_color": "Farbe",
    "created": "Erstellt",
    "label": "Label",
    "color": "Farbe",
    "description": "Beschreibung",
    "save": "Speichern",
    "close": "Schließen",
    "notes_count": "Notizen: {count}",
    "edit_tag": "Tag bearbeiten",
    "add_tag": "Tag hinzufügen",
    "confirm_delete_tag": "Sind Sie sicher, dass Sie diesen Tag löschen möchten?",
    "cannot_delete_tag_in_use": "Ein Tag kann nicht gelöscht werden, wenn er noch von Notizen verwendet wird.",
    "tag_deleted": "Der Tag wurde gelöscht.",
    "tag_not_deleted": "Der Tag konnte nicht gelöscht werden.",
    "unknown_error": "Ein unbekannter Fehler ist aufgetreten."
  },
  "es": {
    "note_tags": "Etiquetas de Notas",
    "notes": "Notas",
    "new": "Nuevo",
    "edit": "Editar",
    "delete": "Eliminar",
    "no_tags": "No hay etiquetas",
    "sort_by": "Ordenar",
    "sort_az": "A-Z",
    "sort_newest_first": "Más nuevas primero",
    "sort_oldest_first": "Más antiguas primero",
    "sort_most_notes": "Más notas",
    "sort_fewest_notes": "Menos notas",
    "sort_color": "Color",
    "created": "Creado",
    "label": "Etiqueta",
    "color": "Color",
    "description": "Descripción",
    "save": "Guardar",
    "close": "Cerrar",
    "notes_count": "Notas: {count}",
    "edit_tag": "Editar Etiqueta",
    "add_tag": "Añadir Etiqueta",
    "confirm_delete_tag": "¿Estás seguro de que quieres eliminar esta etiqueta?",
    "cannot_delete_tag_in_use": "No se puede eliminar una etiqueta que todavía está siendo utilizada por notas.",
    "tag_deleted": "La etiqueta fue eliminada.",
    "tag_not_deleted": "La etiqueta no se pudo eliminar.",
    "unknown_error": "Ocurrió un error desconocido."
  },
  "fr": {
    "note_tags": "Étiquettes de note",
    "notes": "Notes",
    "new": "Nouveau",
    "edit": "Éditer",
    "delete": "Supprimer",
    "no_tags": "Pas d'étiquettes",
    "sort_by": "Trier",
    "sort_az": "A-Z",
    "sort_newest_first": "Plus récentes d’abord",
    "sort_oldest_first": "Plus anciennes d’abord",
    "sort_most_notes": "Le plus de notes",
    "sort_fewest_notes": "Le moins de notes",
    "sort_color": "Couleur",
    "created": "Créé",
    "label": "Étiquette",
    "color": "Couleur",
    "description": "Description",
    "save": "Enregistrer",
    "close": "Fermer",
    "notes_count": "Notes : {count}",
    "edit_tag": "Éditer le tag",
    "add_tag": "Ajouter un tag",
    "confirm_delete_tag": "Voulez-vous vraiment supprimer ce tag ?",
    "cannot_delete_tag_in_use": "Impossible de supprimer un tag encore utilisé par des notes.",
    "tag_deleted": "Le tag a été supprimé.",
    "tag_not_deleted": "Le tag n'a pas pu être supprimé.",
    "unknown_error": "Une erreur inconnue est survenue."
  },
  "ko": {
    "note_tags": "노트 태그",
    "notes": "노트",
    "new": "태그 추가",
    "edit": "편집",
    "delete": "삭제",
    "no_tags": "태그 없음",
    "sort_by": "정렬",
    "sort_az": "가나다순",
    "sort_newest_first": "최신순",
    "sort_oldest_first": "오래된순",
    "sort_most_notes": "노트 많은 순",
    "sort_fewest_notes": "노트 적은 순",
    "sort_color": "색상",
    "created": "생성일시",
    "label": "태그 이름",
    "color": "색상",
    "description": "설명",
    "save": "저장",
    "close": "닫기",
    "notes_count": "노트: {count}",
    "edit_tag": "태그 편집",
    "add_tag": "태그 추가",
    "confirm_delete_tag": "해당 태그를 삭제할까요?",
    "cannot_delete_tag_in_use": "노트에서 사용중인 태그는 삭제할 수 없습니다.",
    "tag_deleted": "태그가 삭제되었습니다.",
    "tag_not_deleted": "태그를 삭제할 수 없습니다.",
    "unknown_error": "알 수 없는 오류가 발생했습니다."
  },
  "pt": {
    "note_tags": "Marcadores",
    "notes": "Notas",
    "new": "Novo",
    "edit": "Editar",
    "delete": "Apagar",
    "no_tags": "Sem Marcadores",
    "sort_by": "Ordenar",
    "sort_az": "A-Z",
    "sort_newest_first": "Mais recentes primeiro",
    "sort_oldest_first": "Mais antigas primeiro",
    "sort_most_notes": "Mais notas",
    "sort_fewest_notes": "Menos notas",
    "sort_color": "Cor",
    "created": "Criado",
    "label": "Nome",
    "color": "Cor",
    "description": "Descrição",
    "save": "Salvar",
    "close": "Fechar",
    "notes_count": "Notas: {count}",
    "edit_tag": "Editar Tag",
    "add_tag": "Adicionar Tag",
    "confirm_delete_tag": "Tem certeza de que deseja excluir esta tag?",
    "cannot_delete_tag_in_use": "Não é possível excluir uma tag que ainda está sendo usada por notas.",
    "tag_deleted": "A tag foi excluída.",
    "tag_not_deleted": "A tag não pôde ser excluída.",
    "unknown_error": "Ocorreu um erro desconhecido."
  },
  "uk": {
    "note_tags": "Теги Нотаток",
    "notes": "Нотатки",
    "new": "Новий",
    "edit": "Редагувати",
    "delete": "Видалити",
    "no_tags": "Немає тегів",
    "sort_by": "Сортувати",
    "sort_az": "A-Z",
    "sort_newest_first": "Найновіші спочатку",
    "sort_oldest_first": "Найстаріші спочатку",
    "sort_most_notes": "Найбільше нотаток",
    "sort_fewest_notes": "Найменше нотаток",
    "sort_color": "Колір",
    "created": "Створено",
    "label": "Мітка",
    "color": "Колір",
    "description": "Опис",
    "save": "Зберегти",
    "close": "Закрити",
    "notes_count": "Нотатки: {count}",
    "edit_tag": "Редагувати Тег",
    "add_tag": "Додати Тег",
    "confirm_delete_tag": "Ви впевнені, що хочете видалити цей тег?",
    "cannot_delete_tag_in_use": "Не можна видалити тег, який все ще використовується нотатками.",
    "tag_deleted": "Тег був видалений.",
    "tag_not_deleted": "Тег не видалено.",
    "unknown_error": "Сталася невідома помилка."
  }
}
</i18n>
