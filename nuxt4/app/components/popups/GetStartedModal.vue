<template>
  <Teleport to="body">
    <Transition name="fade" appear>
      <div v-if="isVisible" class="mbl-modal mbl-modal--active" role="dialog" data-testid="get-started-modal">
        <div class="mbl-modal__backdrop" @click="close" />
        <div class="mbl-modal__card">
          <section class="mbl-modal__body">
            <get-started-step :previous-button-text="t('start_page.back')" @previous="close" />
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import GetStartedStep from '~/components/forms/settings/GetStartedStep.vue';

withDefaults(defineProps<{ isVisible?: boolean }>(), { isVisible: false });

const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();

function close() {
  emit('close');
}
</script>

<style scoped>
.mbl-modal.fade-enter-active,
.mbl-modal.fade-appear-active,
.mbl-modal.fade-leave-active {
  transition: var(--transition-fade);
}

.mbl-modal.fade-enter-active .mbl-modal__card,
.mbl-modal.fade-appear-active .mbl-modal__card,
.mbl-modal.fade-leave-active .mbl-modal__card {
  transition: var(--transition-modal);
}

.mbl-modal.fade-enter-from,
.mbl-modal.fade-leave-to {
  opacity: 0;
}

.mbl-modal.fade-enter-from .mbl-modal__card,
.mbl-modal.fade-leave-to .mbl-modal__card {
  transform: var(--modal-scale);
}

.mbl-modal__body {
  padding: 2rem;
}
</style>

<i18n lang="json">
{
  "en": { "start_page": { "back": "Back" } },
  "de": { "start_page": { "back": "Zurück" } },
  "es": { "start_page": { "back": "Atrás" } },
  "fr": { "start_page": { "back": "Retour" } },
  "ko": { "start_page": { "back": "뒤로" } },
  "pt": { "start_page": { "back": "Voltar" } },
  "uk": { "start_page": { "back": "Назад" } }
}
</i18n>
