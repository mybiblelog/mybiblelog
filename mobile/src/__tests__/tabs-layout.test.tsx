/**
 * Source-level test of the tab navigator config. The navigation *behavior*
 * (re-selecting a tab resets its nested stack) is provided by React Navigation's
 * `popToTopOnBlur` and is verified manually on-device; here we assert the app
 * actually opts into it and no longer relies on the per-tab `tabPress` listener
 * hack that previously only fixed the Bible tab.
 */
let capturedScreenOptions: Record<string, unknown> | undefined;
const capturedScreens: Record<string, unknown>[] = [];

jest.mock("expo-router", () => {
  const React = require("react");
  const Tabs = ({ screenOptions, children }: any) => {
    capturedScreenOptions = screenOptions;
    return React.createElement(React.Fragment, null, children);
  };
  Tabs.Screen = (props: any) => {
    capturedScreens.push(props);
    return null;
  };
  return { Tabs };
});

import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import TabsLayout from "@/app/(tabs)/_layout";

function settingsIcon() {
  const settingsScreen = capturedScreens.find((s) => s.name === "settings");
  const options = (settingsScreen as any).options;
  return renderWithProviders(options.tabBarIcon({ color: "#000", size: 20, focused: false }));
}

beforeEach(() => {
  capturedScreenOptions = undefined;
  capturedScreens.length = 0;
  useAuthStore.setState({ state: { status: "loading" } });
  renderWithProviders(<TabsLayout />);
});

describe("(tabs) layout", () => {
  it("enables popToTopOnBlur so tabs reset to their root on blur", () => {
    expect(capturedScreenOptions).toMatchObject({ popToTopOnBlur: true, headerShown: false });
  });

  it("registers all six tabs", () => {
    const names = capturedScreens.map((s) => s.name);
    expect(names).toEqual(
      expect.arrayContaining(["index", "bible", "calendar", "checklist", "notes", "settings"])
    );
  });

  it("no longer uses a per-tab tabPress listener (popToTopOnBlur replaces it)", () => {
    const withListeners = capturedScreens.filter((s) => s.listeners !== undefined);
    expect(withListeners).toHaveLength(0);
  });

  it("shows an attention dot on the settings tab icon when signed out", () => {
    useAuthStore.setState({ state: { status: "unauthenticated" } });
    capturedScreens.length = 0;
    renderWithProviders(<TabsLayout />);
    expect(settingsIcon().queryByTestId("attentionDot")).toBeTruthy();
  });

  it("hides the attention dot once signed in", () => {
    useAuthStore.setState({
      state: { status: "authenticated", session: { token: "t", user: { email: "a@b.com" } } },
    });
    capturedScreens.length = 0;
    renderWithProviders(<TabsLayout />);
    expect(settingsIcon().queryByTestId("attentionDot")).toBeNull();
  });
});
