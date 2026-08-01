/**
 * The root layout's misconfiguration gate. Covers the failure this exists to
 * prevent: a build missing required env vars used to die at module scope (see
 * `MISSING_CONFIG` in `src/config.ts`) with no on-screen explanation.
 *
 * `@/src/config` is mocked before importing the layout because the layout reads
 * MISSING_CONFIG at module scope to decide whether to call configureGoogleSignIn.
 */

jest.mock("@/src/config", () => ({
  MISSING_CONFIG: ["EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"],
  API_BASE_URL: "",
  GOOGLE_WEB_CLIENT_ID: "",
  GOOGLE_IOS_CLIENT_ID: undefined,
}));

// `mock`-prefixed so jest's hoisting of the factory allows the reference.
const mockConfigureGoogleSignIn = jest.fn();
jest.mock("@/src/auth/googleSignIn", () => ({
  configureGoogleSignIn: mockConfigureGoogleSignIn,
}));

const mockInitStores = jest.fn();
jest.mock("@/src/stores/init", () => ({ initStores: mockInitStores }));

import { render, screen } from "@testing-library/react-native";
import RootLayout from "@/app/_layout";

describe("root layout config gate", () => {
  it("renders the error screen naming the missing var instead of the app", () => {
    render(<RootLayout />);

    expect(screen.getByTestId("config-error.screen")).toBeTruthy();
    expect(screen.getByText("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID")).toBeTruthy();
  });

  it("skips Google Sign-In configuration and store hydration", () => {
    render(<RootLayout />);

    // Both read config that isn't there; calling them is what used to crash.
    expect(mockConfigureGoogleSignIn).not.toHaveBeenCalled();
    expect(mockInitStores).not.toHaveBeenCalled();
  });
});
