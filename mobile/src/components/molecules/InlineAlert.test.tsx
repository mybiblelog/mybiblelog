import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "@/src/test-utils/renderWithProviders";
import { getCache, setCache } from "@/src/storage/dateVerseCountsCache";
import { InlineAlert } from "./InlineAlert";

describe("InlineAlert", () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it("calls onDismiss and hides the card when the dismiss button is pressed", async () => {
    const onDismiss = jest.fn();
    await renderWithProviders(
      <InlineAlert title="Heads up" dismissLabel="Dismiss" onDismiss={onDismiss} testID="alert" />
    );

    expect(screen.getByTestId("alert")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Dismiss"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("alert")).toBeNull();
  });

  it("does not render a dismiss button when dismissLabel is omitted", async () => {
    await renderWithProviders(<InlineAlert title="Heads up" testID="alert" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  describe("dismissKey persistence", () => {
    it("persists the dismissal via setCache under dismissKey", async () => {
      await renderWithProviders(
        <InlineAlert
          title="Heads up"
          dismissLabel="Dismiss"
          dismissKey="test-alert"
          testID="alert"
        />
      );

      // The hydration gate resolves (no prior cache entry) and the card appears.
      await waitFor(() => expect(screen.getByTestId("alert")).toBeTruthy());

      await fireEvent.press(screen.getByLabelText("Dismiss"));

      await waitFor(async () => {
        expect(await getCache<boolean>("test-alert")).toBe(true);
      });
    });

    it("renders null on a fresh mount when the dismissal is already cached", async () => {
      await setCache("test-alert", true, 60);

      await renderWithProviders(
        <InlineAlert
          title="Heads up"
          dismissLabel="Dismiss"
          dismissKey="test-alert"
          testID="alert"
        />
      );

      await waitFor(() => expect(screen.queryByTestId("alert")).toBeNull());
      // Stays null — never flashes the card once hydration completes.
      expect(screen.queryByTestId("alert")).toBeNull();
    });
  });

  describe("hydration gate", () => {
    it("renders null until the cache check resolves when a dismissKey is set", async () => {
      // Async render flushes pending effects, so hold the dismiss-key lookup
      // open to observe the pre-hydration state.
      let releaseLookup!: () => void;
      const lookupHeld = new Promise<void>((resolve) => (releaseLookup = resolve));
      const getItem = AsyncStorage.getItem as jest.Mock;
      const realGetItem = getItem.getMockImplementation()!;
      getItem.mockImplementation(async (key: string, ...rest: unknown[]) => {
        if (key.includes("test-alert")) await lookupHeld;
        return realGetItem(key, ...rest);
      });

      await renderWithProviders(
        <InlineAlert
          title="Heads up"
          dismissLabel="Dismiss"
          dismissKey="test-alert"
          testID="alert"
        />
      );

      expect(screen.queryByTestId("alert")).toBeNull();

      releaseLookup();
      await waitFor(() => expect(screen.getByTestId("alert")).toBeTruthy());
      getItem.mockImplementation(realGetItem);
    });

    it("renders immediately (no gate) when no dismissKey is given", async () => {
      await renderWithProviders(<InlineAlert title="Heads up" testID="alert" />);
      expect(screen.getByTestId("alert")).toBeTruthy();
    });
  });

  describe("CTA layout", () => {
    it("renders a single full-width CTA when there is no secondary action", async () => {
      const onPressCta = jest.fn();
      await renderWithProviders(
        <InlineAlert title="Heads up" ctaLabel="Do it" onPressCta={onPressCta} testID="alert" />
      );

      await fireEvent.press(screen.getByText("Do it"));
      expect(onPressCta).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/secondary/i)).toBeNull();
    });

    it("renders both CTA and secondary CTA when provided", async () => {
      const onPressCta = jest.fn();
      const onPressSecondaryCta = jest.fn();
      await renderWithProviders(
        <InlineAlert
          title="Heads up"
          ctaLabel="Do it"
          onPressCta={onPressCta}
          secondaryCtaLabel="Not now"
          onPressSecondaryCta={onPressSecondaryCta}
          testID="alert"
        />
      );

      await fireEvent.press(screen.getByText("Do it"));
      await fireEvent.press(screen.getByText("Not now"));
      expect(onPressCta).toHaveBeenCalledTimes(1);
      expect(onPressSecondaryCta).toHaveBeenCalledTimes(1);
    });

    it("omits the actions row entirely without a ctaLabel/onPressCta pair", async () => {
      await renderWithProviders(<InlineAlert title="Heads up" testID="alert" />);
      expect(screen.queryByRole("button")).toBeNull();
    });
  });
});
