import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { ChapterMenu } from "./ChapterMenu";

function setup() {
  const handlers = {
    onClose: jest.fn(),
    onOpenInBible: jest.fn(),
    onLogReading: jest.fn(),
    onTakeNote: jest.fn(),
    onViewNotes: jest.fn(),
  };
  const utils = renderWithProviders(<ChapterMenu visible {...handlers} />);
  return { handlers, ...utils };
}

describe("ChapterMenu", () => {
  it("offers the four chapter actions in web order", () => {
    const { getByText } = setup();
    expect(getByText("Open in Bible")).toBeTruthy();
    expect(getByText("Log Reading")).toBeTruthy();
    expect(getByText("Take Note")).toBeTruthy();
    expect(getByText("View Notes")).toBeTruthy();
  });

  it("fires the take-note and view-notes callbacks", () => {
    const { handlers, getByText } = setup();
    fireEvent.press(getByText("Take Note"));
    expect(handlers.onTakeNote).toHaveBeenCalledTimes(1);
    fireEvent.press(getByText("View Notes"));
    expect(handlers.onViewNotes).toHaveBeenCalledTimes(1);
  });
});
