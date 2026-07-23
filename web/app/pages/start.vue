<template>
  <main>
    <div class="content-column">
      <!-- Progress Indicator -->
      <div class="progress-indicator">
        <pill-progress-bar :current-step="progressTab + 1" :total-steps="totalSteps" />
      </div>

      <!-- Welcome -->
      <welcome-step
        v-if="progressTab === 0"
        :button-text="t('start_page.welcome.button')"
        @next="handleNext"
      />

      <!-- Canon selection (chosen first, as it changes the total verse count) -->
      <canon-selection-form
        v-if="progressTab === 1"
        :initial-value="userSettings.includeDeuterocanonical"
        :next-button-text="t('start_page.save_and_continue')"
        :previous-button-text="t('start_page.back')"
        :show-toast="false"
        @next="handleNext"
        @previous="handlePrevious"
      />

      <!-- Daily Verse Count Goal -->
      <daily-verse-count-goal-form
        v-if="progressTab === 2"
        :initial-value="userSettings.dailyVerseCountGoal"
        :next-button-text="t('start_page.save_and_continue')"
        :previous-button-text="t('start_page.back')"
        :show-toast="false"
        @next="handleNext"
        @previous="handlePrevious"
      />

      <!-- Preferred Bible Version and App -->
      <preferred-bible-version-form
        v-if="progressTab === 3"
        :initial-value="userSettings.preferredBibleVersion"
        :initial-bible-app="userSettings.preferredBibleApp"
        :next-button-text="t('start_page.save_and_finish')"
        :previous-button-text="t('start_page.back')"
        :show-toast="false"
        @next="handleNext"
        @previous="handlePrevious"
      />
    </div>

    <!-- Get Started Modal -->
    <get-started-modal :is-visible="showGetStartedModal" @close="closeGetStartedModal" />
  </main>
</template>

<script setup lang="ts">
import WelcomeStep from '~/components/forms/settings/WelcomeStep.vue';
import CanonSelectionForm from '~/components/forms/settings/CanonSelectionForm.vue';
import DailyVerseCountGoalForm from '~/components/forms/settings/DailyVerseCountGoalForm.vue';
import PreferredBibleVersionForm from '~/components/forms/settings/PreferredBibleVersionForm.vue';
import GetStartedModal from '~/components/popups/GetStartedModal.vue';
import PillProgressBar from '~/components/ui/PillProgressBar.vue';
import { useUserSettingsStore } from '~/stores/user-settings';

definePageMeta({ middleware: ['auth', 'start-redirect'] });

const { t } = useI18n();
useHead({ title: () => t('start_page.welcome.title') });

const userSettingsStore = useUserSettingsStore();
const userSettings = computed(() => userSettingsStore.settings);

// 0: Welcome, 1: Canon, 2: Daily Verse Count Goal, 3: Preferred Bible Version and App
const progressTab = ref(0);
const totalSteps = 4;
const showGetStartedModal = ref(false);

onMounted(() => {
  userSettingsStore.loadSettings();
});

function handleNext() {
  if (progressTab.value === totalSteps - 1) {
    showGetStartedModal.value = true;
  }
  else if (progressTab.value < totalSteps - 1) {
    progressTab.value += 1;
  }
}

function handlePrevious() {
  if (progressTab.value > 0) {
    progressTab.value -= 1;
  }
}

function closeGetStartedModal() {
  showGetStartedModal.value = false;
}
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
        "title": "Welcome to your new My Bible Log account!",
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
        "title": "Willkommen in Ihrem neuen My Bible Log-Konto!",
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
        "title": "¡Bienvenido a tu nueva cuenta de My Bible Log!",
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
        "title": "Bienvenue dans votre nouveau compte My Bible Log !",
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
        "title": "My Bible Log 계정에 오신 것을 환영합니다!",
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
        "title": "Bem-vindo à sua nova conta My Bible Log!",
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
        "title": "Ласкаво просимо до вашого нового облікового запису My Bible Log!",
        "button": "Персоналізувати Мої Налаштування"
      }
    }
  }
}
</i18n>
