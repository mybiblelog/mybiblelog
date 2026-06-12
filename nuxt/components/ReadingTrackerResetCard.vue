<template>
  <div v-if="showCard" class="mbl-message mbl-message--info reading-tracker-reset-card">
    <div class="mbl-message__header">
      {{ $t('header') }}
    </div>
    <div class="mbl-message__body">
      <p>{{ $t('message') }}</p>
      <div class="mbl-button-group">
        <button class="mbl-button mbl-button--primary" :disabled="saving" @click="startFresh">
          {{ $t('start_fresh') }}
        </button>
        <button class="mbl-button mbl-button--light" @click="dismiss">
          {{ $t('dismiss') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, getCurrentInstance } from 'vue';
import dayjs from 'dayjs';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';
import { useToastStore } from '~/stores/toast';

const { proxy } = getCurrentInstance()!;

const logEntriesStore = useLogEntriesStore();
const userSettingsStore = useUserSettingsStore();
const toastStore = useToastStore();

const saving = ref(false);

const showCard = computed(() =>
  logEntriesStore.isBibleComplete &&
  !logEntriesStore.hasLogEntriesForToday &&
  !userSettingsStore.readingTrackerResetDelayed,
);

async function startFresh() {
  saving.value = true;
  const today = dayjs().format('YYYY-MM-DD');
  const success = await userSettingsStore.updateSettings({ lookBackDate: today });
  saving.value = false;
  if (!success) {
    toastStore.add({ type: 'error', text: proxy.$t('error_saving') as string });
  }
}

function dismiss() {
  userSettingsStore.dismissReadingTrackerReset();
}
</script>

<style scoped>
.reading-tracker-reset-card {
  margin-bottom: 1.5rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "header": "You've read the whole Bible!",
    "message": "Want to start over? Set your Tracker Start Date to today to begin tracking fresh.",
    "start_fresh": "Start Fresh",
    "dismiss": "Dismiss",
    "error_saving": "Unable to reset your Tracker Start Date. Please try again."
  },
  "de": {
    "header": "Sie haben die ganze Bibel gelesen!",
    "message": "Möchten Sie von vorne beginnen? Setzen Sie Ihr Tracker-Startdatum auf heute, um neu zu verfolgen.",
    "start_fresh": "Neu starten",
    "dismiss": "Schließen",
    "error_saving": "Das Tracker-Startdatum konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut."
  },
  "es": {
    "header": "¡Has leído toda la Biblia!",
    "message": "¿Quieres empezar de nuevo? Establece tu Fecha de Inicio del Rastreador a hoy para empezar a rastrear desde cero.",
    "start_fresh": "Empezar de nuevo",
    "dismiss": "Descartar",
    "error_saving": "No se pudo restablecer tu Fecha de Inicio del Rastreador. Por favor, inténtalo de nuevo."
  },
  "fr": {
    "header": "Vous avez lu toute la Bible !",
    "message": "Vous voulez recommencer ? Définissez votre Date de Début du Suivi à aujourd'hui pour recommencer à suivre.",
    "start_fresh": "Recommencer",
    "dismiss": "Ignorer",
    "error_saving": "Impossible de réinitialiser votre Date de Début du Suivi. Veuillez réessayer."
  },
  "ko": {
    "header": "성경을 다 읽으셨네요!",
    "message": "처음부터 다시 시작하시겠어요? 추적기 시작일을 오늘로 설정하면 새로 시작할 수 있습니다.",
    "start_fresh": "새로 시작",
    "dismiss": "닫기",
    "error_saving": "추적기 시작일을 재설정할 수 없습니다. 다시 시도해 주세요."
  },
  "pt": {
    "header": "Você leu toda a Bíblia!",
    "message": "Quer começar de novo? Defina sua Data de Início do Rastreador para hoje para começar a rastrear do zero.",
    "start_fresh": "Começar do zero",
    "dismiss": "Dispensar",
    "error_saving": "Não foi possível redefinir sua Data de Início do Rastreador. Por favor, tente novamente."
  },
  "uk": {
    "header": "Ви прочитали всю Біблію!",
    "message": "Хочете почати спочатку? Встановіть дату початку відстеження на сьогодні, щоб почати заново.",
    "start_fresh": "Почати заново",
    "dismiss": "Закрити",
    "error_saving": "Не вдалося скинути дату початку відстеження. Будь ласка, спробуйте ще раз."
  }
}
</i18n>
