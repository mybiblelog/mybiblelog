<template>
  <div>
    <site-nav />
    <div class="site-container">
      <slot />
    </div>
    <!-- Expose runtime config for e2e tests (replaces window.$nuxt.$config from Nuxt 2).
         v-if="hydrated" ensures this only appears after Vue mounts, so tests that
         waitForFunction on this element are guaranteed to wait for full hydration. -->
    <div
      v-if="hydrated"
      data-testid="nuxt4-config"
      :data-require-email-verification="String(config.public.requireEmailVerification)"
      style="display:none"
    />
    <floating-feedback-button />
    <app-toaster />
    <pwa-prompt />
    <app-dialog />
    <log-entry-editor-modal />
    <passage-note-editor-modal />
    <passage-note-tag-editor-modal />
    <action-sheet-modal />
  </div>
</template>

<script setup lang="ts">
import SiteNav from '~/components/layout/SiteNav.vue';
import FloatingFeedbackButton from '~/components/ui/FloatingFeedbackButton.vue';
import AppToaster from '~/components/ui/AppToaster.vue';
import PwaPrompt from '~/components/ui/PwaPrompt.vue';
import AppDialog from '~/components/popups/AppDialog.vue';
import LogEntryEditorModal from '~/components/popups/LogEntryEditorModal.vue';
import PassageNoteEditorModal from '~/components/popups/PassageNoteEditorModal.vue';
import PassageNoteTagEditorModal from '~/components/popups/PassageNoteTagEditorModal.vue';
import ActionSheetModal from '~/components/popups/ActionSheetModal.vue';
import { useThemeStore } from '~/stores/theme';

const config = useRuntimeConfig();
const themeStore = useThemeStore();
const { locale } = useI18n();

const hydrated = ref(false);
onMounted(() => { hydrated.value = true; });

useHead({
  htmlAttrs: {
    lang: () => locale.value,
    'data-theme': () => themeStore.mode === 'system' ? undefined : themeStore.mode,
    style: () => `color-scheme: ${themeStore.resolvedTheme};`,
  },
  bodyAttrs: {
    class: 'has-site-nav-fixed',
  },
});
</script>
