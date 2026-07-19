import { defineStore } from 'pinia';
import type { AuthChannelFlow } from '~/composables/auth-channel';

export type AuthCodeFlow = AuthChannelFlow;

/**
 * Drives the single, globally-mounted AuthCodeModal. Each email-auth entry point
 * (register, "forgot password", "change email") opens it with the flow and the
 * already-known email; the modal then collects the short code and completes the
 * flow against the email-scoped API.
 */
export const useAuthCodeStore = defineStore('auth-code', {
  state: () => ({
    isOpen: false,
    flow: 'verify-email' as AuthCodeFlow,
    email: '',
  }),
  actions: {
    open(payload: { flow: AuthCodeFlow; email: string }) {
      this.flow = payload.flow;
      this.email = payload.email.trim();
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    },
  },
});
