import { fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { LogEntryMenu } from "./LogEntryMenu";

function setup(overrides: Partial<Parameters<typeof LogEntryMenu>[0]> = {}) {
  const handlers = {
    onClose: jest.fn(),
    onOpenInBible: jest.fn(),
    onContinueReading: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };
  const utils = renderWithProviders(<LogEntryMenu visible {...handlers} {...overrides} />);
  return { handlers, ...utils };
}

describe("LogEntryMenu", () => {
  it("offers Continue Reading between Open in Bible and Edit when handler is given", () => {
    const { handlers, getByText } = setup();
    expect(getByText("Open in Bible")).toBeTruthy();
    expect(getByText("Continue Reading")).toBeTruthy();
    fireEvent.press(getByText("Continue Reading"));
    expect(handlers.onContinueReading).toHaveBeenCalledTimes(1);
  });

  it("omits Continue Reading when no handler is given (final verse)", () => {
    const { queryByText } = setup({ onContinueReading: undefined });
    expect(queryByText("Continue Reading")).toBeNull();
  });
});
