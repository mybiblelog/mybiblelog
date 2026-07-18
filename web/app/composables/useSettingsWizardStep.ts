import type { Ref } from 'vue';
import { useToastStore } from '~/stores/toast';

/**
 * Drives the save/validate/toast/error flow shared by the settings wizard step
 * forms and the individual save handlers on the reading-settings page: guard
 * against concurrent saves, optionally validate, run the async save, surface a
 * success toast or an inline error message, and reset the saving flag.
 *
 * `save` returns whether the persist succeeded. Pass a shared `saving` ref when
 * several steps live on one page and should disable together (the reading page);
 * otherwise each step gets its own. `errorMessage` doubles as the validation
 * failure message, matching the existing forms.
 */
export function useSettingsWizardStep(opts: {
  save: () => Promise<boolean>;
  errorMessage: () => string;
  successMessage?: () => string;
  validate?: () => boolean;
  showToast?: () => boolean;
  onSuccess?: () => void;
  saving?: Ref<boolean>;
}) {
  const toastStore = useToastStore();
  const isSaving = opts.saving ?? ref(false);
  const error = ref('');

  async function submit() {
    if (isSaving.value) { return; }
    error.value = '';

    if (opts.validate && !opts.validate()) {
      error.value = opts.errorMessage();
      return;
    }

    isSaving.value = true;
    try {
      const success = await opts.save();
      if (success) {
        if (opts.successMessage && (opts.showToast ? opts.showToast() : true)) {
          toastStore.add({ type: 'success', text: opts.successMessage() });
        }
        opts.onSuccess?.();
      }
      else {
        error.value = opts.errorMessage();
      }
    }
    finally {
      isSaving.value = false;
    }
  }

  return { isSaving, error, submit };
}
