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
import TabsLayout from "./_layout";

beforeEach(() => {
  capturedScreenOptions = undefined;
  capturedScreens.length = 0;
  renderWithProviders(<TabsLayout />);
});

describe("(tabs) layout", () => {
  it("enables popToTopOnBlur so tabs reset to their root on blur", () => {
    expect(capturedScreenOptions).toMatchObject({ popToTopOnBlur: true, headerShown: false });
  });

  it("registers all six tabs", () => {
    const names = capturedScreens.map((s) => s.name);
    expect(names).toEqual(
      expect.arrayContaining(["index", "bible", "calendar", "checklist", "log", "settings"]),
    );
  });

  it("no longer uses a per-tab tabPress listener (popToTopOnBlur replaces it)", () => {
    const withListeners = capturedScreens.filter((s) => s.listeners !== undefined);
    expect(withListeners).toHaveLength(0);
  });
});
