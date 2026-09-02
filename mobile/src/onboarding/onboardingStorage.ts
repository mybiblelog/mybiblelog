import { appStorage } from "@/src/storage/keys";

export type OnboardingState = {
  completed: boolean;
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = { completed: false };

function isOnboardingState(value: unknown): value is OnboardingState {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { completed: unknown }).completed === "boolean"
  );
}

export async function loadOnboardingState(): Promise<OnboardingState> {
  const stored = await appStorage.get("onboarding");
  return isOnboardingState(stored) ? stored : DEFAULT_ONBOARDING_STATE;
}

export async function saveOnboardingState(state: OnboardingState): Promise<boolean> {
  return appStorage.set("onboarding", state);
}
