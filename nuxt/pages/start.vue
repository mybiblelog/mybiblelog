<template>
  <main>
    <div class="content-column">
      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <pill-progress-bar
          :current-step="progressTab + 1"
          :total-steps="totalSteps"
        />
      </div>

      <!-- Welcome -->
      <welcome-step
        v-if="progressTab === 0"
        :button-text="$t('start_page.welcome.button')"
        @next="handleNext"
      />

      <!-- Daily Verse Count Goal -->
      <daily-verse-count-goal-form
        v-if="progressTab === 1"
        :initial-value="userSettings.dailyVerseCountGoal"
        :next-button-text="$t('start_page.save_and_continue')"
        :previous-button-text="$t('start_page.back')"
        :show-toast="false"
        @next="handleNext"
        @previous="handlePrevious"
      />

      <!-- Preferred Bible Version and App -->
      <preferred-bible-version-form
        v-if="progressTab === 2"
        :initial-value="userSettings.preferredBibleVersion"
        :initial-bible-app="userSettings.preferredBibleApp"
        :next-button-text="$t('start_page.save_and_finish')"
        :previous-button-text="$t('start_page.back')"
        :show-toast="false"
        @next="handleNext"
        @previous="handlePrevious"
      />
    </div>

    <!-- Get Started Modal -->
    <get-started-modal
      :is-visible="showGetStartedModal"
      @close="closeGetStartedModal"
    />
  </main>
</template>

<script>
import WelcomeStep from '@/components/forms/settings/WelcomeStep.vue';
import DailyVerseCountGoalForm from '@/components/forms/settings/DailyVerseCountGoalForm.vue';
import PreferredBibleVersionForm from '@/components/forms/settings/PreferredBibleVersionForm.vue';
import GetStartedModal from '@/components/popups/GetStartedModal.vue';
import PillProgressBar from '@/components/ui/PillProgressBar.vue';
import { useUserSettingsStore } from '~/stores/user-settings';

export default {
  name: 'StartPage',
  components: {
    WelcomeStep,
    DailyVerseCountGoalForm,
    PreferredBibleVersionForm,
    GetStartedModal,
    PillProgressBar,
  },
  middleware: ['auth'],
  async asyncData({ app, redirect }) {
    // Redirect to the user's preferred start page if they have one
    try {
      const { data } = await app.$http.get('/api/settings');
      const { startPage, locale } = data;

      if (startPage !== 'start') {
        // Mapping these individually allows URLs to change separately
        // from the start page names in user settings
        const redirectPath = {
          today: '/today',
          books: '/books',
          checklist: '/checklist',
          calendar: '/calendar',
          notes: '/notes',
        }[startPage];
        if (redirectPath) {
          return redirect(app.localePath(redirectPath, locale));
        }
      }
    }
    catch (err) {
      const status = err?.statusCode || err?.status || err?.response?.status;
      if (status === 401) {
        return redirect(app.localePath('/login'));
      }
      // If settings fail to load for other reasons, show the start page
    }

    return {};
  },
  data() {
    return {
      // 0: Welcome
      // 1: Daily Verse Count Goal
      // 2: Preferred Bible Version and App
      progressTab: 0,
      totalSteps: 3,
      showGetStartedModal: false,
    };
  },
  async fetch() {
    await useUserSettingsStore().loadSettings();
  },
  computed: {
    userSettings() {
      return useUserSettingsStore().settings;
    },
  },
  methods: {
    handleNext() {
      if (this.progressTab === 2) {
        // Show modal when clicking "Save and Continue" from Preferred Bible Version form
        this.showGetStartedModal = true;
      }
      else if (this.progressTab < this.totalSteps - 1) {
        this.progressTab += 1;
      }
    },
    handlePrevious() {
      if (this.progressTab > 0) {
        this.progressTab -= 1;
      }
    },
    closeGetStartedModal() {
      this.showGetStartedModal = false;
    },
  },
};
</script>

<style scoped>
.progress-indicator {
  margin-bottom: 2rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "start_page": {
      "save_and_continue": "Save and Continue",
      "save_and_finish": "Save and Finish",
      "back": "Back",
      "welcome": {
        "button": "Personalize My Settings"
      }
    }
  },
  "de": {
    "start_page": {
      "save_and_continue": "Speichern und Fortfahren",
      "save_and_finish": "Speichern und Fertigstellen",
      "back": "Zurück",
      "welcome": {
        "button": "Meine Einstellungen personalisieren"
      }
    }
  },
  "es": {
    "start_page": {
      "save_and_continue": "Guardar y Continuar",
      "save_and_finish": "Guardar y Finalizar",
      "back": "Atrás",
      "welcome": {
        "button": "Personalizar Mi Configuración"
      }
    }
  },
  "fr": {
    "start_page": {
      "save_and_continue": "Enregistrer et Continuer",
      "save_and_finish": "Enregistrer et Finir",
      "back": "Retour",
      "welcome": {
        "button": "Personnaliser Mes Paramètres"
      }
    }
  },
  "ko": {
    "start_page": {
      "save_and_continue": "저장 및 계속",
      "save_and_finish": "저장 및 완료",
      "back": "뒤로",
      "welcome": {
        "button": "내 설정 개인화"
      }
    }
  },
  "pt": {
    "start_page": {
      "save_and_continue": "Salvar e Continuar",
      "save_and_finish": "Salvar e Finalizar",
      "back": "Voltar",
      "welcome": {
        "button": "Personalizar Minhas Configurações"
      }
    }
  },
  "uk": {
    "start_page": {
      "save_and_continue": "Зберегти та Продовжити",
      "save_and_finish": "Зберегти та Завершити",
      "back": "Назад",
      "welcome": {
        "button": "Персоналізувати Мої Налаштування"
      }
    }
  }
}
</i18n>
