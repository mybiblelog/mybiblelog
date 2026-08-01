/**
 * Complement to `root-layout-config-gate`: the gate must not disturb a correctly
 * configured build. `configureGoogleSignIn` is a module-scope side effect of
 * `app/_layout.tsx`, and gating it is exactly the kind of change that could
 * silently stop it running — so assert it still does.
 */

jest.mock("@/src/config", () => ({
  MISSING_CONFIG: [],
  API_BASE_URL: "http://localhost:3000",
  GOOGLE_WEB_CLIENT_ID: "web-id",
  GOOGLE_IOS_CLIENT_ID: undefined,
}));

const mockConfigureGoogleSignIn = jest.fn();
jest.mock("@/src/auth/googleSignIn", () => ({
  configureGoogleSignIn: mockConfigureGoogleSignIn,
}));

jest.mock("@/src/stores/init", () => ({ initStores: jest.fn() }));

describe("root layout with valid config", () => {
  it("configures Google Sign-In at module scope", () => {
    require("@/app/_layout");

    expect(mockConfigureGoogleSignIn).toHaveBeenCalledTimes(1);
  });
});
