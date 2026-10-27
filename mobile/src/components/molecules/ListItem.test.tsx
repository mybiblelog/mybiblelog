import { ListItem } from "./ListItem";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("ListItem", () => {
  it("renders title, subtitle, and meta", async () => {
    await renderWithProviders(<ListItem title="Account" subtitle="a@b.com" meta="Updated" />);
    expect(screen.getByText("Account")).toBeTruthy();
    expect(screen.getByText("a@b.com")).toBeTruthy();
    expect(screen.getByText("Updated")).toBeTruthy();
  });

  it("is tappable and fires onPress when given a handler", async () => {
    const onPress = jest.fn();
    await renderWithProviders(<ListItem title="Account" onPress={onPress} chevron />);
    const row = screen.getByRole("button");
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders as a non-interactive view when no onPress is provided", async () => {
    await renderWithProviders(<ListItem title="Static" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Static")).toBeTruthy();
  });
});
