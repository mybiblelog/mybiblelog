import { Text } from "react-native";
import { Card } from "./Card";
import { renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("Card", () => {
  it("renders its children", () => {
    renderWithProviders(
      <Card>
        <Text>Inside</Text>
      </Card>,
    );
    expect(screen.getByText("Inside")).toBeTruthy();
  });

  it("renders without throwing for the elevated, unpadded variant", () => {
    expect(() =>
      renderWithProviders(
        <Card variant="surface" elevated padded={false}>
          <Text>Elevated</Text>
        </Card>,
      ),
    ).not.toThrow();
  });
});
