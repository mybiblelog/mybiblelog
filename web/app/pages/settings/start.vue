<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ t('start_page') }}
    </h2>
    <div class="mbl-field mbl-field--addons">
      <div class="mbl-control">
        <div class="mbl-select">
          <select v-model="form.startPage" data-testid="settings-start-page-select" :disabled="!mounted">
            <option value="" disabled>
              {{ t('select_an_option') }}
            </option>
            <option v-for="option in startPageOptions" :key="option.value" :value="option.value">
              {{ option.text }}
            </option>
          </select>
        </div>
      </div>
      <div class="mbl-control">
        <button class="mbl-button mbl-button--primary" data-testid="settings-start-page-save" :disabled="!mounted || saving" @click="saveStartPage">
          {{ t('save') }}
        </button>
      </div>
    </div>
    <div v-if="errors.startPage" class="mbl-help mbl-help--danger">
      {{ errors.startPage }}
    </div>
    <p>{{ t('start_page_info') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useUserSettingsStore } from '~/stores/user-settings';
import { useToastStore } from '~/stores/toast';

definePageMeta({ middleware: ['auth'] });
useHead({ meta: [{ name: 'robots', content: 'noindex' }] });

const mounted = ref(false);
const saving = ref(false);
onMounted(() => { mounted.value = true; });

const { t } = useI18n();
const userSettingsStore = useUserSettingsStore();
const toastStore = useToastStore();

const settings = computed(() => userSettingsStore.settings);
const form = reactive({ startPage: settings.value.startPage || 'start' });
const errors = reactive({ startPage: '' });

watch(settings, (s) => {
  form.startPage = s.startPage || 'start';
}, { immediate: true });

const startPageOptions = computed(() => [
  { text: t('today'), value: 'today' },
  { text: t('bible_books'), value: 'books' },
  { text: t('chapter_checklist'), value: 'checklist' },
  { text: t('calendar'), value: 'calendar' },
  { text: t('notes'), value: 'notes' },
]);

async function saveStartPage() {
  if (saving.value) { return; }
  saving.value = true;
  errors.startPage = '';
  try {
    const success = await userSettingsStore.updateSettings({ startPage: form.startPage });
    if (success) {
      toastStore.add({ type: 'success', text: t('start_page_saved') });
    }
    else {
      errors.startPage = t('unable_to_save_start_page');
    }
  }
  finally {
    saving.value = false;
  }
}
</script>

<style scoped>
select {
  max-width: 65vw;
}
</style>

<i18n lang="json">
{
  "en": {
    "start_page": "Start Page",
    "today": "Today",
    "bible_books": "Bible Books",
    "chapter_checklist": "Chapter Checklist",
    "calendar": "Calendar",
    "notes": "Notes",
    "save": "Save",
    "select_an_option": "Select an Option",
    "start_page_saved": "Preferred start page saved successfully.",
    "unable_to_save_start_page": "Unable to save.",
    "start_page_info": "This page will be displayed when you first log in to My Bible Log."
  },
  "de": {
    "start_page": "Startseite",
    "today": "Heute",
    "bible_books": "Bibelbücher",
    "chapter_checklist": "Kapitel Checkliste",
    "calendar": "Kalender",
    "notes": "Notizen",
    "save": "Speichern",
    "select_an_option": "Eine Option auswählen",
    "start_page_saved": "Bevorzugte Startseite erfolgreich gespeichert.",
    "unable_to_save_start_page": "Nicht gespeichert.",
    "start_page_info": "Diese Seite wird angezeigt, wenn Sie sich zum ersten Mal bei My Bible Log anmelden."
  },
  "es": {
    "start_page": "Página de inicio",
    "today": "Hoy",
    "bible_books": "Libros Bíblicos",
    "chapter_checklist": "Lista de Capítulos",
    "calendar": "Calendario",
    "notes": "Notas",
    "save": "Guardar",
    "select_an_option": "Seleccionar una opción",
    "start_page_saved": "Página de inicio preferida guardada con éxito.",
    "unable_to_save_start_page": "No se puede guardar.",
    "start_page_info": "Esta página se mostrará cuando inicie sesión por primera vez en My Bible Log."
  },
  "fr": {
    "start_page": "Page de démarrage",
    "today": "Aujourd'hui",
    "bible_books": "Livres de la Bible",
    "chapter_checklist": "Liste de Contrôle",
    "calendar": "Calendrier",
    "notes": "Notes",
    "save": "Enregistrer",
    "select_an_option": "Sélectionner une option",
    "start_page_saved": "Page de démarrage préférée enregistrée avec succès.",
    "unable_to_save_start_page": "Impossible d'enregistrer.",
    "start_page_info": "Cette page s'affichera lors de votre première connexion à My Bible Log."
  },
  "ko": {
    "start_page": "시작 페이지",
    "today": "오늘의 성경",
    "bible_books": "성경 일람",
    "chapter_checklist": "장별 체크",
    "calendar": "달력",
    "notes": "노트",
    "save": "저장",
    "select_an_option": "옵션 선택",
    "start_page_saved": "선호 초기 화면이 저장되었습니다.",
    "unable_to_save_start_page": "저장할 수 없습니다.",
    "start_page_info": "My Bible Log에 처음 로그인할 때 이 페이지가 표시됩니다."
  },
  "pt": {
    "start_page": "Página de início",
    "today": "Hoje",
    "bible_books": "Livros da Bíblia",
    "chapter_checklist": "Lista de Capítulos",
    "calendar": "Calendário",
    "notes": "Notas",
    "save": "Salvar",
    "select_an_option": "Selecionar uma Opção",
    "start_page_saved": "Página de início preferida salva com sucesso.",
    "unable_to_save_start_page": "Não é possível salvar.",
    "start_page_info": "Esta página será exibida quando você fizer login pela primeira vez no My Bible Log."
  },
  "uk": {
    "start_page": "Стартова сторінка",
    "today": "Сьогодні",
    "bible_books": "Книги Біблії",
    "chapter_checklist": "Список розділів",
    "calendar": "Календар",
    "notes": "Нотатки",
    "save": "Зберегти",
    "select_an_option": "Вибрати опцію",
    "start_page_saved": "Обрану стартову сторінку успішно збережено.",
    "unable_to_save_start_page": "Не вдалося зберегти.",
    "start_page_info": "Ця сторінка відображатиметься, коли ви вперше увійдете до My Bible Log."
  }
}
</i18n>
