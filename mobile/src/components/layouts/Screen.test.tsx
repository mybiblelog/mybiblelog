import { Text as RNText } from "react-native";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import { Screen } from "./Screen";

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: false });
  // The connectivity strip only renders while signed in.
  useAuthStore.setState({
    state: { status: "authenticated", session: { token: "t", user: { email: "a@b.c" } } },
  });
});

describe("Screen", () => {
  it("keeps the status banner full-bleed even when `padded` insets the content", async () => {
    const { getByText, container } = await renderWithProviders(
      <Screen padded>
        <RNText>content</RNText>
      </Screen>
    );

    getByText("content");
    getByText("You’re offline — changes will sync when you reconnect.");

    // Walk up from the StatusBanner root (its live region; its own padding is
    // fine) to the Screen root — none of those ancestors should carry
    // horizontal padding, or the banner would be inset from screen edges.
    const [banner] = container.queryAll((n) => n.props.accessibilityLiveRegion === "polite");
    expect(banner).toBeDefined();
    let node = banner?.parent ?? null;
    while (node && node !== container) {
      const flatStyle = Array.isArray(node.props.style) ? node.props.style : [node.props.style];
      for (const s of flatStyle) {
        if (s && (s.paddingHorizontal || s.paddingLeft || s.paddingRight)) {
          throw new Error("status banner is inset by an ancestor's horizontal padding");
        }
      }
      node = node.parent;
    }
  });
});
