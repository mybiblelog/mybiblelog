import { create } from "zustand";
import {
  DEFAULT_ONBOARDING_STATE,
  loadOnboardingState,
  saveOnboardingState,
} from "@/src/onboarding/onboardingStorage";
import { useAuthStore } from "@/src/stores/auth";

/**
 * Onboarding store (Zustand).
 *
 * Tracks whether the device has completed (or been backfilled past) the
 * onboarding wizard. Gates the root navigator (`app/_layout.tsx`) between the
 * wizard and the tab stack.
 *
 * Once a real account is established — the wizard's "Log In" path, or any
 * later sign-in from Settings → Account — onboarding must never show again,
 * regardless of how the user got there. That's enforced here via an
 * auth-transition subscription rather than by threading a flag through every
 * screen that can end in a successful login.
 */

export type OnboardingStoreState = { status: "loading" } | { status: "ready"; completed: boolean };

type OnboardingStore = {
  state: OnboardingStoreState;
  markOnboardingCompleted: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  state: { status: "loading" },

  async markOnboardingCompleted() {
    set({ state: { status: "ready", completed: true } });
    await saveOnboardingState({ completed: true });
  },
}));

let initialized = false;

export function initOnboarding(): void {
  if (initialized) return;
  initialized = true;

  void (async () => {
    const stored = await loadOnboardingState();
    useOnboardingStore.setState({ state: { status: "ready", completed: stored.completed } });
  })();

  let wasAuthenticated = useAuthStore.getState().state.status === "authenticated";
  useAuthStore.subscribe((s) => {
    const nowAuthenticated = s.state.status === "authenticated";
    if (!wasAuthenticated && nowAuthenticated) {
      void useOnboardingStore.getState().markOnboardingCompleted();
    }
    wasAuthenticated = nowAuthenticated;
  });
}

export function useOnboardingStatus(): OnboardingStoreState {
  return useOnboardingStore((s) => s.state);
}

export const onboardingActions = {
  markOnboardingCompleted: () => useOnboardingStore.getState().markOnboardingCompleted(),
};

/** Dev-only QA re-trigger — clears the completed flag so the wizard shows again. */
export async function resetOnboardingForTesting(): Promise<void> {
  useOnboardingStore.setState({ state: { status: "ready", completed: false } });
  await saveOnboardingState({ ...DEFAULT_ONBOARDING_STATE });
}
