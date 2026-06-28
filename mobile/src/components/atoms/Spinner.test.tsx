import { ActivityIndicator } from "react-native";
import { Spinner } from "./Spinner";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

describe("Spinner", () => {
  it("renders an ActivityIndicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(<Spinner />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("passes the size through", () => {
    const { UNSAFE_getByType } = renderWithProviders(<Spinner size="large" />);
    expect(UNSAFE_getByType(ActivityIndicator).props.size).toBe("large");
  });
});
