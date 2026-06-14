<template>
  <main class="error-page">
    <div class="mbl-section error-page__section">
      <div class="mbl-container mbl-text-center">
        <div class="error-page__panel">
          <p class="error-page__code">
            {{ statusCode }}
          </p>
          <h1 class="mbl-title mbl-title--2 error-page__title">
            {{ headline }}
          </h1>
          <p class="mbl-content error-page__lead">
            {{ lead }}
          </p>
          <div class="error-page__actions">
            <nuxt-link
              class="mbl-button mbl-button--primary"
              :to="localePath('/')"
            >
              {{ $t('error_page.home') }}
            </nuxt-link>
            <button
              v-if="showRetry"
              type="button"
              class="mbl-button mbl-button--light"
              @click="reload"
            >
              {{ $t('error_page.try_again') }}
            </button>
          </div>
          <p class="mbl-text-small mbl-text-muted error-page__hint">
            {{ $t('error_page.help_hint') }}
          </p>
        </div>
        <p class="error-page__brand">
          {{ $t('my_bible_log') }}
        </p>
      </div>
    </div>
    <floating-feedback-button />
  </main>
</template>

<script>
import FloatingFeedbackButton from '@/components/ui/FloatingFeedbackButton.vue';

export default {
  components: {
    FloatingFeedbackButton,
  },
  props: {
    error: {
      type: Object,
      default: () => ({
        statusCode: 500,
        message: 'No error information is available.',
      }),
    },
  },
  head() {
    const title = this.isNotFound
      ? this.$t('error_page.doc_title_not_found')
      : this.$t('error_page.doc_title_error');
    return {
      title,
      meta: [
        {
          hid: 'error-robots',
          name: 'robots',
          content: 'noindex, nofollow',
        },
      ],
    };
  },
  computed: {
    statusCode() {
      return this.error?.statusCode ?? 500;
    },
    isNotFound() {
      return this.statusCode === 404;
    },
    headline() {
      return this.isNotFound
        ? this.$t('error_page.not_found_title')
        : this.$t('error_page.error_title');
    },
    lead() {
      return this.isNotFound
        ? this.$t('error_page.not_found_lead')
        : this.$t('error_page.error_lead');
    },
    showRetry() {
      return !this.isNotFound;
    },
  },
  methods: {
    reload() {
      if (process.client) {
        window.location.reload();
      }
    },
  },
};
</script>

<style scoped>
.error-page {
  background: linear-gradient(
    165deg,
    var(--mbl-primary-soft) 0%,
    var(--mbl-bg-subtle) 42%,
    var(--mbl-tertiary-soft) 100%
  );
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.error-page__section {
  flex: 1;
  display: flex;
  align-items: center;
  padding-top: 2rem;
  padding-bottom: 3rem;
}

.error-page__panel {
  background-color: var(--mbl-bg);
  border: 1px solid var(--mbl-border);
  border-radius: 12px;
  box-shadow: var(--mbl-shadow);
  max-width: 32rem;
  margin-left: auto;
  margin-right: auto;
  padding: 2rem 1.5rem 1.75rem;
}

@media screen and (min-width: 769px) {
  .error-page__panel {
    padding: 2.5rem 2rem 2rem;
  }
}

.error-page__code {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  margin: 0 0 1rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  color: var(--secondary-color);
  background-color: var(--mbl-secondary-soft-08);
  border: 1px solid var(--mbl-secondary-soft-20);
}

.error-page__title {
  margin-bottom: 1rem;
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--secondary-color) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--mbl-text);
}

.error-page__lead {
  margin-bottom: 0;
}

.error-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.75rem;
}

.error-page__hint {
  margin: 1.5rem 0 0;
  max-width: 22rem;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

.error-page__brand {
  margin: 2rem 0 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--mbl-text-muted);
  letter-spacing: 0.02em;
}
</style>

<i18n lang="json">
{
  "en": {
    "error_page": {
      "doc_title_not_found": "Page not found",
      "doc_title_error": "Something went wrong",
      "not_found_title": "We can't find that page",
      "not_found_lead": "The link may be wrong or the page may have moved. Let's get you back to reading.",
      "error_title": "Something went wrong",
      "error_lead": "We're having trouble loading this page. Please try again in a moment.",
      "home": "Go to home",
      "try_again": "Try again",
      "help_hint": "If this keeps happening, use the feedback button in the corner."
    }
  },
  "de": {
    "error_page": {
      "doc_title_not_found": "Seite nicht gefunden",
      "doc_title_error": "Etwas ist schiefgelaufen",
      "not_found_title": "Diese Seite gibt es nicht",
      "not_found_lead": "Der Link ist vielleicht falsch oder die Seite wurde verschoben. Zurück zur Übersicht.",
      "error_title": "Etwas ist schiefgelaufen",
      "error_lead": "Diese Seite lässt sich gerade nicht laden. Bitte versuche es gleich noch einmal.",
      "home": "Zur Startseite",
      "try_again": "Erneut versuchen",
      "help_hint": "Wenn das weiter passiert, nutze den Feedback-Button in der Ecke."
    }
  },
  "es": {
    "error_page": {
      "doc_title_not_found": "Página no encontrada",
      "doc_title_error": "Algo salió mal",
      "not_found_title": "No encontramos esa página",
      "not_found_lead": "El enlace puede estar mal o la página se movió. Volvamos a tu lectura.",
      "error_title": "Algo salió mal",
      "error_lead": "Tenemos problemas para cargar esta página. Inténtalo de nuevo en un momento.",
      "home": "Ir al inicio",
      "try_again": "Reintentar",
      "help_hint": "Si sigue pasando, usa el botón de comentarios en la esquina."
    }
  },
  "fr": {
    "error_page": {
      "doc_title_not_found": "Page introuvable",
      "doc_title_error": "Une erreur s'est produite",
      "not_found_title": "Nous ne trouvons pas cette page",
      "not_found_lead": "Le lien est peut-être incorrect ou la page a été déplacée. Revenons à votre lecture.",
      "error_title": "Une erreur s'est produite",
      "error_lead": "Nous n'arrivons pas à charger cette page. Réessayez dans un instant.",
      "home": "Accueil",
      "try_again": "Réessayer",
      "help_hint": "Si le problème continue, utilisez le bouton de commentaires dans le coin."
    }
  },
  "ko": {
    "error_page": {
      "doc_title_not_found": "페이지를 찾을 수 없습니다",
      "doc_title_error": "문제가 발생했습니다",
      "not_found_title": "해당 페이지를 찾을 수 없어요",
      "not_found_lead": "주소가 잘못되었거나 페이지가 옮겨졌을 수 있어요. 홈으로 돌아가 볼까요?",
      "error_title": "문제가 발생했습니다",
      "error_lead": "이 페이지를 불러오는 데 문제가 있어요. 잠시 후 다시 시도해 주세요.",
      "home": "홈으로",
      "try_again": "다시 시도",
      "help_hint": "같은 현상이 반복되면 오른쪽 아래 피드백 버튼을 이용해 주세요."
    }
  },
  "pt": {
    "error_page": {
      "doc_title_not_found": "Página não encontrada",
      "doc_title_error": "Algo deu errado",
      "not_found_title": "Não encontramos essa página",
      "not_found_lead": "O link pode estar incorreto ou a página foi movida. Vamos voltar à leitura.",
      "error_title": "Algo deu errado",
      "error_lead": "Estamos com dificuldade para carregar esta página. Tente novamente em instantes.",
      "home": "Ir ao início",
      "try_again": "Tentar de novo",
      "help_hint": "Se isso continuar, use o botão de feedback no canto da tela."
    }
  },
  "uk": {
    "error_page": {
      "doc_title_not_found": "Сторінку не знайдено",
      "doc_title_error": "Щось пішло не так",
      "not_found_title": "Ми не знайшли цю сторінку",
      "not_found_lead": "Посилання може бути неправильним або сторінку перенесено. Повернімося до читання.",
      "error_title": "Щось пішло не так",
      "error_lead": "Не вдається завантажити цю сторінку. Спробуйте ще раз за хвилину.",
      "home": "На головну",
      "try_again": "Спробувати знову",
      "help_hint": "Якщо це повторюється, скористайтеся кнопкою зворотного зв'язку в кутку."
    }
  }
}
</i18n>
