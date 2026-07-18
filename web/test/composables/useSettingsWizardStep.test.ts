import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useSettingsWizardStep } from '~/composables/useSettingsWizardStep';

const state = vi.hoisted(() => ({ add: vi.fn() }));

vi.mock('~/stores/toast', () => ({
  useToastStore: () => ({ add: state.add }),
}));

beforeEach(() => {
  state.add.mockClear();
});

describe('useSettingsWizardStep', () => {
  it('saves, toasts success and runs onSuccess', async () => {
    const onSuccess = vi.fn();
    const { error, submit } = useSettingsWizardStep({
      save: vi.fn().mockResolvedValue(true),
      successMessage: () => 'saved!',
      errorMessage: () => 'nope',
      onSuccess,
    });
    await submit();
    expect(state.add).toHaveBeenCalledWith({ type: 'success', text: 'saved!' });
    expect(onSuccess).toHaveBeenCalled();
    expect(error.value).toBe('');
  });

  it('surfaces the error message when the save fails', async () => {
    const { error, submit } = useSettingsWizardStep({
      save: vi.fn().mockResolvedValue(false),
      errorMessage: () => 'nope',
    });
    await submit();
    expect(error.value).toBe('nope');
    expect(state.add).not.toHaveBeenCalled();
  });

  it('short-circuits on failed validation without saving', async () => {
    const save = vi.fn();
    const { error, submit } = useSettingsWizardStep({
      save,
      validate: () => false,
      errorMessage: () => 'invalid',
    });
    await submit();
    expect(save).not.toHaveBeenCalled();
    expect(error.value).toBe('invalid');
  });

  it('skips the toast when showToast returns false', async () => {
    const { submit } = useSettingsWizardStep({
      save: vi.fn().mockResolvedValue(true),
      successMessage: () => 'saved!',
      errorMessage: () => 'nope',
      showToast: () => false,
    });
    await submit();
    expect(state.add).not.toHaveBeenCalled();
  });

  it('ignores concurrent submits via a shared saving flag', async () => {
    const saving = ref(true);
    const save = vi.fn().mockResolvedValue(true);
    const { submit } = useSettingsWizardStep({ saving, save, errorMessage: () => 'nope' });
    await submit();
    expect(save).not.toHaveBeenCalled();
  });

  it('resets the saving flag after a save', async () => {
    const saving = ref(false);
    const { submit } = useSettingsWizardStep({ saving, save: vi.fn().mockResolvedValue(true), errorMessage: () => 'nope' });
    await submit();
    expect(saving.value).toBe(false);
  });
});
