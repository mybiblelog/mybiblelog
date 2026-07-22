<template>
  <app-modal
    :open="justOpenedStore.open"
    :title="t('just_opened')"
    @close="justOpenedStore.dismiss()"
  >
    <template #content>
      <p data-testid="just-opened-message">
        {{ t('you_opened', { passage: passageName }) }}
      </p>
      <div class="just-opened__actions">
        <button
          class="mbl-button mbl-button--primary"
          data-testid="just-opened-log"
          @click="logReading"
        >
          {{ t('log_reading') }}
        </button>
        <button
          class="mbl-button mbl-button--light"
          data-testid="just-opened-note"
          @click="takeNote"
        >
          {{ t('take_note') }}
        </button>
      </div>
    </template>
    <template #footer>
      <button
        class="mbl-button mbl-button--light"
        data-testid="just-opened-dismiss"
        @click="justOpenedStore.dismiss()"
      >
        {{ t('dismiss') }}
      </button>
    </template>
  </app-modal>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import AppModal from '~/components/popups/AppModal.vue';
import { useJustOpenedStore } from '~/stores/just-opened';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';

const { t, locale } = useI18n();
const justOpenedStore = useJustOpenedStore();

const passageName = computed(() => {
  const { startVerseId, endVerseId } = justOpenedStore;
  if (startVerseId === null || endVerseId === null) {
    return '';
  }
  return Bible.displayVerseRange(startVerseId, endVerseId, locale.value);
});

function logReading() {
  const { startVerseId, endVerseId } = justOpenedStore;
  justOpenedStore.dismiss();
  if (startVerseId === null || endVerseId === null) {
    return;
  }
  useLogEntryEditorStore().openEditor({
    id: null,
    date: dayjs().format('YYYY-MM-DD'),
    startVerseId,
    endVerseId,
  });
}

function takeNote() {
  const { startVerseId, endVerseId } = justOpenedStore;
  justOpenedStore.dismiss();
  if (startVerseId === null || endVerseId === null) {
    return;
  }
  usePassageNoteEditorStore().openEditor({
    passages: [{ startVerseId, endVerseId }],
    content: '',
  });
}
</script>

<i18n lang="json">
{
  "en": {
    "just_opened": "Just Opened",
    "you_opened": "You opened {passage} to read.",
    "log_reading": "Log Reading",
    "take_note": "Take Note",
    "dismiss": "Dismiss"
  },
  "de": {
    "just_opened": "Gerade geöffnet",
    "you_opened": "{passage} wurde zum Lesen geöffnet.",
    "log_reading": "Lesen protokollieren",
    "take_note": "Notiz hinzufügen",
    "dismiss": "Schließen"
  },
  "es": {
    "just_opened": "Recién abierto",
    "you_opened": "Abriste {passage} para leer.",
    "log_reading": "Agregar lectura a registro",
    "take_note": "Tomar nota",
    "dismiss": "Descartar"
  },
  "fr": {
    "just_opened": "Ouvert à l'instant",
    "you_opened": "Vous avez ouvert {passage} pour lire.",
    "log_reading": "Ajouter lecture à registre",
    "take_note": "Prendre note",
    "dismiss": "Fermer"
  },
  "ko": {
    "just_opened": "방금 열었습니다",
    "you_opened": "{passage}을(를) 읽기 위해 열었습니다.",
    "log_reading": "기록 추가",
    "take_note": "노트 작성",
    "dismiss": "닫기"
  },
  "pt": {
    "just_opened": "Aberto agora",
    "you_opened": "Você abriu {passage} para ler.",
    "log_reading": "Adicionar leitura a registro",
    "take_note": "Tomar nota",
    "dismiss": "Dispensar"
  },
  "uk": {
    "just_opened": "Щойно відкрито",
    "you_opened": "Ви відкрили {passage} для читання.",
    "log_reading": "Додати читання до журналу",
    "take_note": "Записати",
    "dismiss": "Закрити"
  }
}
</i18n>

<style scoped>
.just-opened__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.just-opened__actions .mbl-button {
  width: 100%;
}
</style>
