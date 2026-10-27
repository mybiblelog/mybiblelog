import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { ChapterMenu } from "./ChapterMenu";

async function setup() {
  const handlers = {
    onClose: jest.fn(),
    onOpenInBible: jest.fn(),
    onLogReading: jest.fn(),
    onTakeNote: jest.fn(),
    onViewNotes: jest.fn(),
  };
  const utils = await renderWithProviders(<ChapterMenu visible title="Genesis 1" {...handlers} />);
  return { handlers, ...utils };
}

describe("ChapterMenu", () => {
  it("offers the four chapter actions in web order", async () => {
    const { getByText } = await setup();
    expect(getByText("Open in Bible")).toBeTruthy();
    expect(getByText("Log Reading")).toBeTruthy();
    expect(getByText("Take Note")).toBeTruthy();
    expect(getByText("View Notes")).toBeTruthy();
  });

  it("fires the take-note and view-notes callbacks", async () => {
    const { handlers, getByText } = await setup();
    await fireEvent.press(getByText("Take Note"));
    expect(handlers.onTakeNote).toHaveBeenCalledTimes(1);
    await fireEvent.press(getByText("View Notes"));
    expect(handlers.onViewNotes).toHaveBeenCalledTimes(1);
  });
});
