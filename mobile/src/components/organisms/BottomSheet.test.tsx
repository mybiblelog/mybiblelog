import { act } from "react";
import { Keyboard, Text } from "react-native";
import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { BottomSheet } from "./BottomSheet";

/**
 * `Keyboard` is no longer a NativeEventEmitter (no `.emit`), so drive the
 * listeners BottomSheet registered by capturing them off `addListener`.
 */
function captureKeyboardListeners() {
  const handlers = new Map<string, (e: unknown) => void>();
  jest.spyOn(Keyboard, "addListener").mockImplementation(((event: string, handler: never) => {
    handlers.set(event, handler);
    return { remove: () => handlers.delete(event) };
  }) as never);
  return {
    emit(event: string, height: number) {
      act(() => {
        handlers.get(event)?.({ endCoordinates: { height, width: 0, screenX: 0, screenY: 0 } });
      });
    },
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("BottomSheet", () => {
  it.each(["sheet", "center", "full"] as const)("renders children in the %s variant", (variant) => {
    const { getByText } = renderWithProviders(
      <BottomSheet visible variant={variant} onClose={jest.fn()}>
        <Text>Editor body</Text>
      </BottomSheet>
    );
    expect(getByText("Editor body")).toBeTruthy();
  });

  it("closes when the backdrop is pressed", () => {
    const onClose = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <BottomSheet visible onClose={onClose}>
        <Text>Editor body</Text>
      </BottomSheet>
    );
    fireEvent.press(getByLabelText("Dismiss"));
    expect(onClose).toHaveBeenCalled();
  });

  it("stays mounted while the keyboard opens and closes", () => {
    const keyboard = captureKeyboardListeners();
    const { getByText } = renderWithProviders(
      <BottomSheet visible variant="full" onClose={jest.fn()}>
        <Text>Editor body</Text>
      </BottomSheet>
    );

    keyboard.emit("keyboardDidShow", 320);
    expect(getByText("Editor body")).toBeTruthy();

    keyboard.emit("keyboardDidHide", 0);
    expect(getByText("Editor body")).toBeTruthy();
  });

  it("does not subscribe to keyboard events while hidden", () => {
    const spy = jest.spyOn(Keyboard, "addListener");
    renderWithProviders(
      <BottomSheet visible={false} onClose={jest.fn()}>
        <Text>Editor body</Text>
      </BottomSheet>
    );
    expect(spy).not.toHaveBeenCalled();
  });
});
