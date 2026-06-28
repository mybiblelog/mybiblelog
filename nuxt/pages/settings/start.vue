<template>
  <div>
    <h2 class="mbl-title mbl-title--4">
      {{ $t('start_page') }}
    </h2>
    <div class="mbl-field mbl-field--addons">
      <div class="mbl-control">
        <div class="mbl-select">
          <select v-model="userSettingsForm.startPage" data-testid="settings-start-page-select">
            <option value="" selected="selected" disabled="disabled">
              {{ $t('select_an_option') }}
            </option>
            <option v-for="option in startPageOptions" :key="option.value" :value="option.value" :selected="option.value === userSettingsForm.startPage">
              {{ option.text }}
            </option>
          </select>
        </div>
      </div>
      <div class="mbl-control">
        <button type="button" class="mbl-button mbl-button--primary" :disabled="saving" data-testid="settings-start-page-save" @click="handleStartPageSubmit">{{ $t('save') }}</button>
      </div>
    </div>
    <div v-if="userSettingsErrors.startPage" class="mbl-help mbl-help--danger">
      {{ $terr(userSettingsErrors.startPage, { field: $t('preferred_start_page.title') }) }}
    </div>
    <p>{{ $t('preferred_start_page.info.1') }}</p>
  </div>
</template>

<script>
import { useToastStore } from '~/stores/toast';
import { useUserSettingsStore } from '~/stores/user-settings';

export default {
  name: 'StartPageSettingsPage',
  middleware: ['auth'],
  data() {
    return {
      userSettingsForm: {
        startPage: '',
      },
      userSettingsErrors: {
        startPage: '',
      },
      saving: false,
    };
  },
  head() {
    return {
      meta: [
        { hid: 'robots', name: 'robots', content: 'noindex' },
      ],
    };
  },
  computed: {
    userSettings() {
      return useUserSettingsStore().settings;
    },
    startPageOptions() {
      return [
        // This option can be enabled for development of the "Start" page
        // { text: this.$t('start'), value: 'start' },
        { text: this.$t('today'), value: 'today' },
        { text: this.$t('bible_books'), value: 'books' },
        { text: this.$t('chapter_checklist'), value: 'checklist' },
        { text: this.$t('calendar'), value: 'calendar' },
        { text: this.$t('notes'), value: 'notes' },
      ];
    },
  },
  created() {
    this.userSettingsForm.startPage = this.userSettings.startPage || 'start';
  },
  methods: {
    async handleStartPageSubmit() {
      if (this.saving) { return; }
      this.saving = true;
      try {
        const { startPage } = this.userSettingsForm;
        const success = await useUserSettingsStore().updateSettings({ startPage });
        if (success) {
          const toastStore = useToastStore();
          toastStore.add({
            type: 'success',
            text: this.$t('messaging.preferred_start_page_saved_successfully'),
          });
        }
        else {
          this.userSettingsErrors.startPage = this.$t('messaging.unable_to_save_preferred_start_page');
        }
      }
      finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped>
main p {
  margin-bottom: 1rem;
}

select {
  /*  cap <select> width so it doesn't overflow mobile device */
  max-width: 65vw;
}
</style>

<i18n lang="json">
{
  "en": {
    "start_page": "Start Page",
    "start": "Start",
    "today": "Today",
    "bible_books": "Bible Books",
    "chapter_checklist": "Chapter Checklist",
    "calendar": "Calendar",
    "notes": "Notes",
    "save": "Save",
    "select_an_option": "Select an Option",
    "preferred_start_page": {
      "info": {
        "1": "This page will be displayed when you first log in to My Bible Log."
      }
    },
    "messaging": {
      "preferred_start_page_saved_successfully": "Preferred start page saved successfully.",
      "unable_to_save_preferred_start_page": "Unable to save."
    }
  },
  "de": {
    "start_page": "Startseite",
    "start": "Start",
    "today": "Heute",
    "bible_books": "Bibelbücher",
    "chapter_checklist": "Kapitel Checkliste",
    "calendar": "Kalender",
    "notes": "Notizen",
    "save": "Speichern",
    "select_an_option": "Eine Option auswählen",
    "preferred_start_page": {
      "info": {
        "1": "Diese Seite wird angezeigt, wenn Sie sich zum ersten Mal bei My Bible Log anmelden."
      }
    },
    "messaging": {
      "preferred_start_page_saved_successfully": "Bevorzugte Startseite erfolgreich gespeichert.",
      "unable_to_save_preferred_start_page": "Nicht gespeichert."
    }
  },
  "es": {
    "start_page": "Página de inicio",
    "start": "Inicio",
    "today": "Hoy",
    "bible_books": "Libros Bíblicos",
    "chapter_checklist": "Lista de Capítulos",
    "calendar": "Calendario",
    "notes": "Notas",
    "save": "Guardar",
    "select_an_option": "Seleccionar una opción",
    "preferred_start_page": {
      "info": {
        "1": "Esta página se mostrará cuando inicie sesión por primera vez en My Bible Log."
      }
    },
    "messaging": {
      "preferred_start_page_saved_successfully": "Página de inicio preferida guardada con éxito.",
      "unable_to_save_preferred_start_page": "No se puede guardar."
    }
  },
  "fr": {
    "start_page": "Page de démarrage",
    "start": "Démarrer",
    "today": "Aujourd'hui",
    "bible_books": "Livres de la Bible",
    "chapter_checklist": "Liste de Contrôle",
    "calendar": "Calendrier",
    "notes": "Notes",
    "save": "Enregistrer",
    "select_an_option": "Sélectionner une option",
    "preferred_start_page": {
      "info": {
        "1": "Cette page s'affichera lorsque vous vous connecterez pour la première fois à My Bible Log."
      }
    },
    "messaging": {
      "preferred_start_page_saved_successfully": "Page de démarrage préférée enregistrée avec succès.",
      "unable_to_save_preferred_start_page": "Impossible d'enregistrer."
    }
  },
  "ko": {
    "start_page": "시작 페이지",
    "start": "시작",
    "today": "오늘의 성경",
    "bible_books": "성경 일람",
    "chapter_checklist": "장별 체크",
    "calendar": "달력",
    "notes": "노트",
    "save": "저장",
    "select_an_option": "옵션 선택",
    "preferred_start_page": {
      "info": {
        "1": "My Bible Log에 로그인할 때 이 페이지가 표시됩니다."
      }
    },
    "messaging": {
      "preferred_start_page_saved_successfully": "선호 초기 화면이 저장되었습니다.",
      "unable_to_save_preferred_start_page": "저장할 수 없습니다."
    }
  },
  "pt": {
    "start_page": "Página de início",
    "start": "Início",
    "today": "Hoje",
    "bible_books": "Livros da Bíblia",
    "chapter_checklist": "Lista de Capítulos",
    "calendar": "Calendário",
    "notes": "Notas",
    "save": "Salvar",
    "select_an_option": "Selecionar uma Opção",
    "preferred_start_page": {
      "info": {
        "1": "Esta página será exibida quando você fizer login pela primeira vez no My Bible Log."
      }
    },
    "messaging": {
      "preferred_start_page_saved_successfully": "Página de início preferida salva com sucesso.",
      "unable_to_save_preferred_start_page": "Não é possível salvar."
    }
  },
  "uk": {
    "start_page": "Стартова сторінка",
    "start": "Старт",
    "today": "Сьогодні",
    "bible_books": "Книги Біблії",
    "chapter_checklist": "Список розділів",
    "calendar": "Календар",
    "notes": "Нотатки",
    "save": "Зберегти",
    "select_an_option": "Вибрати опцію",
    "preferred_start_page": {
      "info": {
        "1": "Ця сторінка буде відображатися, коли ви вперше ввійдете в My Bible Log."
      }
    },
    "messaging": {
      "preferred_start_page_saved_successfully": "Обрану стартову сторінку успішно збережено.",
      "unable_to_save_preferred_start_page": "Не вдалося зберегти."
    }
  }
}
</i18n>
