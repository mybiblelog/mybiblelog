import { EmptyState } from "./EmptyState";
import { fireEvent, renderWithProviders, screen } from "@/src/test-utils/renderWithProviders";

describe("EmptyState", () => {
  it("renders title and supporting text", async () => {
    await renderWithProviders(<EmptyState title="Nothing here" text="Add your first entry" />);
    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.getByText("Add your first entry")).toBeTruthy();
  });

  it("renders a CTA only when both label and handler are provided", async () => {
    const onPressCta = jest.fn();
    await renderWithProviders(
      <EmptyState title="Empty" ctaLabel="Add entry" onPressCta={onPressCta} />
    );
    await fireEvent.press(screen.getByText("Add entry"));
    expect(onPressCta).toHaveBeenCalledTimes(1);
  });

  it("omits the CTA when no handler is given", async () => {
    await renderWithProviders(<EmptyState title="Empty" ctaLabel="Add entry" />);
    expect(screen.queryByText("Add entry")).toBeNull();
  });
});
