import { renderHook } from "@testing-library/react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useEntering } from "./entering";

jest.mock("react-native-reanimated", () => ({
  ...jest.requireActual("react-native-reanimated"),
  useReducedMotion: jest.fn(),
}));

const mockedUseReducedMotion = jest.mocked(useReducedMotion);

describe("useEntering", () => {
  const animation = { kind: "fade" };

  it("passes the animation through when reduced motion is off", async () => {
    mockedUseReducedMotion.mockReturnValue(false);
    const { result } = await renderHook(() => useEntering(animation));
    expect(result.current).toBe(animation);
  });

  it("drops the animation under reduced motion", async () => {
    mockedUseReducedMotion.mockReturnValue(true);
    const { result } = await renderHook(() => useEntering(animation));
    expect(result.current).toBeUndefined();
  });
});
