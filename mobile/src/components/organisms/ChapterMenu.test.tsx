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
    expect(getByText("Log reading")).toBeTruthy();
    expect(getByText("Take note")).toBeTruthy();
    expect(getByText("View notes")).toBeTruthy();
  });

  it("fires the take-note and view-notes callbacks", () => {
    const { handlers, getByText } = setup();
    fireEvent.press(getByText("Take note"));
    expect(handlers.onTakeNote).toHaveBeenCalledTimes(1);
    fireEvent.press(getByText("View notes"));
    expect(handlers.onViewNotes).toHaveBeenCalledTimes(1);
  });
});
