<template>
  <div v-if="authStore.loggedIn" class="no-print">
    <button
      class="floating-action-button"
      data-testid="floating-feedback-button"
      :aria-label="$t('floating_action_button.give_feedback')"
      @click="openModal"
    >
      <feedback-icon fill="var(--mbl-on-accent)" width="28px" height="28px" />
    </button>
    <feedback-modal :is-visible="isModalVisible" @close="closeModal" />
  </div>
</template>

<script>
import FeedbackIcon from '@/components/svg/FeedbackIcon.vue';
import FeedbackModal from '@/components/popups/FeedbackModal.vue';
import { useAuthStore } from '~/stores/auth';

export default {
  name: 'FloatingFeedbackButton',
  components: {
    FeedbackIcon,
    FeedbackModal,
  },
  data() {
    return {
      isModalVisible: false,
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    },
  },
  methods: {
    openModal() {
      this.isModalVisible = true;
    },
    closeModal() {
      this.isModalVisible = false;
    },
  },
};
</script>

<style scoped>
.floating-action-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--secondary-color);
  color: var(--mbl-on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--mbl-overlay-15);
  transition: all 0.3s ease;
  z-index: var(--z-index-action-button);
  text-decoration: none;
  border: none;
  cursor: pointer;
}

.floating-action-button:hover {
  background-color: var(--secondary-color-hover);
  box-shadow: 0 6px 16px var(--mbl-overlay-20);
  transform: translateY(-2px);
}

.floating-action-button:active {
  transform: translateY(0);
  box-shadow: var(--mbl-shadow-soft);
}

@media screen and (max-width: 768px) {
  .floating-action-button {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 48px;
    height: 48px;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "floating_action_button": {
      "give_feedback": "Give Feedback"
    }
  },
  "de": {
    "floating_action_button": {
      "give_feedback": "Feedback geben"
    }
  },
  "es": {
    "floating_action_button": {
      "give_feedback": "Dar Comentarios"
    }
  },
  "fr": {
    "floating_action_button": {
      "give_feedback": "Donner des Commentaires"
    }
  },
  "ko": {
    "floating_action_button": {
      "give_feedback": "피드백 보내기"
    }
  },
  "pt": {
    "floating_action_button": {
      "give_feedback": "Dar Feedback"
    }
  },
  "uk": {
    "floating_action_button": {
      "give_feedback": "Залишити відгук"
    }
  }
}
</i18n>
