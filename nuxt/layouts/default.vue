<template>
  <div>
    <site-nav />
    <div class="site-container">
      <nuxt />
    </div>
    <app-toaster />
    <pop-ups />
    <app-achievements />
    <passage-note-editor-modal />
    <passage-note-tag-editor-modal />
    <log-entry-editor-modal />
    <action-sheet-modal />
    <floating-feedback-button />
  </div>
</template>

<script>
import SiteNav from '@/components/layout/SiteNav.vue';
import FloatingFeedbackButton from '@/components/ui/FloatingFeedbackButton.vue';
import AppToaster from '@/components/ui/AppToaster.vue';
import PopUps from '@/components/popups/PopUps.vue';
import AppAchievements from '~/components/popups/AppAchievements.vue';
import PassageNoteEditorModal from '@/components/popups/PassageNoteEditorModal.vue';
import PassageNoteTagEditorModal from '@/components/popups/PassageNoteTagEditorModal.vue';
import LogEntryEditorModal from '@/components/popups/LogEntryEditorModal.vue';
import ActionSheetModal from '@/components/popups/ActionSheetModal.vue';
import { useThemeStore } from '~/stores/theme';

export default {
  components: {
    SiteNav,
    FloatingFeedbackButton,
    AppToaster,
    PopUps,
    AppAchievements,
    PassageNoteEditorModal,
    PassageNoteTagEditorModal,
    LogEntryEditorModal,
    ActionSheetModal,
  },
  head() {
    const themeStore = useThemeStore();
    const dataTheme = themeStore.mode === 'system' ? undefined : themeStore.mode;
    return {
      htmlAttrs: {
        lang: this.$i18n.locale,
        'data-theme': dataTheme,
        style: `color-scheme: ${themeStore.resolvedTheme};`,
      },
    };
  },
};
</script>

<style scoped>
/* no scoped styles */
</style>
