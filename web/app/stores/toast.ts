import { defineStore } from 'pinia';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | string;

export type ToastMessage = {
  id: number;
  type?: ToastType;
  text: string;
};

export type ToastMessageInput = Omit<ToastMessage, 'id'> & { id?: number };

const TOAST_TIMEOUT_MS = 5000;

export const useToastStore = defineStore('toast', {
  state: () => ({
    messages: [] as ToastMessage[],
  }),
  actions: {
    add(message: ToastMessageInput): void {
      const id = typeof message?.id === 'number' ? message.id : Date.now();
      const toast: ToastMessage = {
        id,
        type: message?.type,
        text: String(message?.text ?? ''),
      };
      this.messages.push(toast);
      setTimeout(() => this.close(id), TOAST_TIMEOUT_MS);
    },
    close(id: number): void {
      this.messages = this.messages.filter(message => message.id !== id);
    },
  },
});
