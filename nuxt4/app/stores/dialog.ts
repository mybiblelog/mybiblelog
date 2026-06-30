import { defineStore } from 'pinia';

export type DialogType = '' | 'alert' | 'confirm';
export type ButtonType = 'primary' | 'secondary' | 'danger';

export type AlertOptions = {
  title?: string;
  message?: string;
  buttonText?: string;
  buttonType?: ButtonType;
};

export type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmButtonText?: string;
  confirmButtonType?: ButtonType;
  cancelButtonText?: string;
};

export type DialogState = {
  open: boolean;
  type: DialogType;
  title: string;
  message: string;
  buttonText: string;
  buttonType: ButtonType;
  confirmButtonText: string;
  confirmButtonType: ButtonType;
  cancelButtonText: string;
  resolvePromise?: (value?: unknown) => void;
};

const emptyState: Omit<DialogState, 'resolvePromise'> = {
  open: false,
  type: '',
  title: '',
  message: '',
  buttonText: '',
  buttonType: 'primary',
  confirmButtonText: '',
  confirmButtonType: 'primary',
  cancelButtonText: '',
};

export const useDialogStore = defineStore('dialog', {
  state: (): DialogState => ({
    ...emptyState,
    resolvePromise: undefined,
  }),
  actions: {
    alert(options: AlertOptions = {}): Promise<void> {
      return new Promise((resolve) => {
        this.title = options.title || '';
        this.message = options.message || '';
        this.buttonText = options.buttonText || '';
        this.buttonType = options.buttonType || 'primary';
        this.type = 'alert';
        this.open = true;
        this.resolvePromise = () => resolve();
      });
    },
    confirm(options: ConfirmOptions = {}): Promise<boolean> {
      return new Promise((resolve) => {
        this.title = options.title || '';
        this.message = options.message || '';
        this.confirmButtonText = options.confirmButtonText || '';
        this.confirmButtonType = options.confirmButtonType || 'primary';
        this.cancelButtonText = options.cancelButtonText || '';
        this.type = 'confirm';
        this.open = true;
        this.resolvePromise = value => resolve(Boolean(value));
      });
    },
    closeAlert(): void {
      if (this.resolvePromise) { this.resolvePromise(); }
      this.$reset();
    },
    acceptConfirm(): void {
      if (this.resolvePromise) { this.resolvePromise(true); }
      this.$reset();
    },
    cancelConfirm(): void {
      if (this.resolvePromise) { this.resolvePromise(false); }
      this.$reset();
    },
  },
});
