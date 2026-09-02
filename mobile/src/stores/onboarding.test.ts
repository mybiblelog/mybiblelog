/**
 * `initOnboarding` is guarded by a module-level `initialized` flag (and owns a
 * module-level auth subscription), so every case runs inside
 * `jest.isolateModulesAsync` with a fresh registry — mirrors `auth.init.test.ts`.
 */

const mockLoadOnboardingState = jest.fn();
const mockSaveOnboardingState = jest.fn();

jest.mock("@/src/onboarding/onboardingStorage", () => ({
  DEFAULT_ONBOARDING_STATE: { completed: false },
  loadOnboardingState: (...args: unknown[]) => mockLoadOnboardingState(...args),
  saveOnboardingState: (...args: unknown[]) => mockSaveOnboardingState(...args),
}));

type AuthStatus = "loading" | "unauthenticated" | "authenticated";
let mockAuthStatus: AuthStatus = "unauthenticated";
const mockAuthListeners: ((s: { state: { status: AuthStatus } }) => void)[] = [];

jest.mock("@/src/stores/auth", () => ({
  useAuthStore: {
    getState: () => ({ state: { status: mockAuthStatus } }),
    subscribe: (listener: (s: { state: { status: AuthStatus } }) => void) => {
      mockAuthListeners.push(listener);
      return () => {};
    },
  },
}));

function setAuthStatus(status: AuthStatus) {
  mockAuthStatus = status;
  mockAuthListeners.forEach((l) => l({ state: { status } }));
}

type OnboardingModule = typeof import("./onboarding");

async function withFreshOnboarding(fn: (mod: OnboardingModule) => Promise<void>) {
  await jest.isolateModulesAsync(async () => {
    const mod = require("./onboarding") as OnboardingModule;
    await fn(mod);
  });
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  mockAuthStatus = "unauthenticated";
  mockAuthListeners.length = 0;
  mockLoadOnboardingState.mockReset();
  mockSaveOnboardingState.mockReset();
  mockSaveOnboardingState.mockResolvedValue(true);
});

describe("hydration", () => {
  it("hydrates completed from storage", async () => {
    mockLoadOnboardingState.mockResolvedValue({ completed: true });
    await withFreshOnboarding(async (mod) => {
      mod.initOnboarding();
      await flush();

      expect(mod.useOnboardingStore.getState().state).toEqual({
        status: "ready",
        completed: true,
      });
    });
  });

  it("hydrates not-completed from storage", async () => {
    mockLoadOnboardingState.mockResolvedValue({ completed: false });
    await withFreshOnboarding(async (mod) => {
      mod.initOnboarding();
      await flush();

      expect(mod.useOnboardingStore.getState().state).toEqual({
        status: "ready",
        completed: false,
      });
    });
  });
});

describe("auth-transition completion", () => {
  it("marks onboarding completed on a fresh sign-in even if storage said incomplete", async () => {
    mockLoadOnboardingState.mockResolvedValue({ completed: false });
    await withFreshOnboarding(async (mod) => {
      mod.initOnboarding();
      await flush();
      expect(mod.useOnboardingStore.getState().state).toMatchObject({ completed: false });

      setAuthStatus("authenticated");
      await flush();

      expect(mod.useOnboardingStore.getState().state).toEqual({
        status: "ready",
        completed: true,
      });
      expect(mockSaveOnboardingState).toHaveBeenCalledWith({ completed: true });
    });
  });

  it("does not re-mark completed on an authenticated->unauthenticated transition", async () => {
    mockAuthStatus = "authenticated";
    mockLoadOnboardingState.mockResolvedValue({ completed: true });
    await withFreshOnboarding(async (mod) => {
      mod.initOnboarding();
      await flush();
      mockSaveOnboardingState.mockClear();

      setAuthStatus("unauthenticated");
      await flush();

      expect(mockSaveOnboardingState).not.toHaveBeenCalled();
    });
  });
});

describe("resetOnboardingForTesting", () => {
  it("clears the completed flag", async () => {
    mockLoadOnboardingState.mockResolvedValue({ completed: true });
    await withFreshOnboarding(async (mod) => {
      mod.initOnboarding();
      await flush();

      await mod.resetOnboardingForTesting();

      expect(mod.useOnboardingStore.getState().state).toEqual({
        status: "ready",
        completed: false,
      });
      expect(mockSaveOnboardingState).toHaveBeenCalledWith({ completed: false });
    });
  });
});
