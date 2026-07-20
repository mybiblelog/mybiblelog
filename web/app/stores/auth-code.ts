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
    // The account email the flow is keyed on: it drives the completion API call
    // and cross-tab event matching. For change-email this is the CURRENT address
    // (the record holding the code is keyed by it), NOT where the code was sent.
    email: '',
    // Where the code was actually delivered, shown to the user. Only differs from
    // `email` for change-email (the code goes to the NEW address). Empty ⇒ display
    // falls back to `email`.
    sentToEmail: '',
  }),
  actions: {
    open(payload: { flow: AuthCodeFlow; email: string; sentToEmail?: string }) {
      this.flow = payload.flow;
      this.email = payload.email.trim();
      this.sentToEmail = (payload.sentToEmail ?? '').trim();
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    },
  },
});
