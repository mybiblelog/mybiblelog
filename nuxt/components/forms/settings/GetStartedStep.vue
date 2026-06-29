<template>
  <div>
    <h2 class="mbl-title mbl-title--5">
      {{ $t('start_page.get_started.title') }}
    </h2>
    <div class="mbl-content">
      <p>
        {{ $t('start_page.get_started.description') }}
      </p>
    </div>
    <div class="mbl-field">
      <div class="mbl-control mbl-button-group">
        <button class="mbl-button mbl-button--primary mbl-button--lg" @click="handleGetStarted">
          {{ $t('start_page.get_started.button') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserSettingsStore } from '~/stores/user-settings';

export default {
  name: 'GetStartedStep',
  props: {
    previousButtonText: {
      type: String,
      default: 'Back',
    },
  },
  computed: {
    userSettings() {
      return useUserSettingsStore().settings;
    },
  },
  methods: {
    handlePrevious() {
      this.$emit('previous');
    },
    async handleGetStarted() {
      await useUserSettingsStore().updateSettings({ startPage: 'today' });
      this.$router.push('/today');
    },
  },
};
</script>

<style scoped>
.feedback-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--mbl-bg-muted);
  border-radius: 8px;
  border: 1px solid var(--neutral-200);
  margin-top: 1rem;
}

.feedback-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: 50%;
  background-color: var(--mbl-text-muted);
  box-shadow: 0 4px 12px var(--mbl-overlay-15);
  flex-shrink: 0;
}

.feedback-text {
  margin: 0;
  flex: 1;
}

@media screen and (max-width: 768px) {
  .feedback-icon-container {
    width: 48px;
    height: 48px;
    min-width: 48px;
  }

  .feedback-card {
    gap: 0.75rem;
    padding: 0.75rem;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "start_page": {
      "get_started": {
        "title": "Get Started",
        "description": "You're all set up! It's time to start reading.",
        "feedback_hint": "One last thing - you can provide feedback, request features, and report bugs by clicking this feedback button in the bottom right corner.",
        "button": "Let's Go"
      }
    }
  },
  "de": {
    "start_page": {
      "get_started": {
        "title": "Loslegen",
        "description": "Sie sind fertig eingerichtet! Es ist Zeit, mit dem Lesen zu beginnen.",
        "feedback_hint": "Eine letzte Sache - Sie können Feedback geben, Funktionen anfordern und Fehler melden, indem Sie auf diese Feedback-Schaltfläche in der unteren rechten Ecke klicken.",
        "button": "Los geht's"
      }
    }
  },
  "es": {
    "start_page": {
      "get_started": {
        "title": "Comenzar",
        "description": "¡Todo está listo! Es hora de comenzar a leer.",
        "feedback_hint": "Una última cosa: puede proporcionar comentarios, solicitar funciones e informar errores haciendo clic en este botón de comentarios en la esquina inferior derecha.",
        "button": "Vamos"
      }
    }
  },
  "fr": {
    "start_page": {
      "get_started": {
        "title": "Commencer",
        "description": "Tout est prêt ! Il est temps de commencer à lire.",
        "feedback_hint": "Une dernière chose - vous pouvez fournir des commentaires, demander des fonctionnalités et signaler des bugs en cliquant sur ce bouton de commentaires dans le coin inférieur droit.",
        "button": "Allons-y"
      }
    }
  },
  "ko": {
    "start_page": {
      "get_started": {
        "title": "시작하기",
        "description": "준비가 모두 끝났습니다! 이제 성경을 읽기 시작할 시간이에요.",
        "feedback_hint": "마지막으로, 우하단에 보이는 피드백 버튼을 눌러 의견·기능 요청·버그 신고를 진행할 수 있습니다.",
        "button": "시작해볼까요?"
      }
    }
  },
  "pt": {
    "start_page": {
      "get_started": {
        "title": "Começar",
        "description": "Tudo está pronto! É hora de começar a ler.",
        "feedback_hint": "Uma última coisa - você pode fornecer feedback, solicitar recursos e relatar bugs clicando neste botão de feedback no canto inferior direito.",
        "button": "Vamos lá"
      }
    }
  },
  "uk": {
    "start_page": {
      "get_started": {
        "title": "Почніть",
        "description": "Все налаштовано! Час почати читати.",
        "feedback_hint": "Останнє - ви можете надати відгук, запросити функції та повідомити про помилки, натиснувши цю кнопку відгуку в правому нижньому куті.",
        "button": "Поїхали"
      }
    }
  }
}
</i18n>
