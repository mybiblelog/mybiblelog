import { Bible } from "@mybiblelog/shared";
import { Platform } from "react-native";
import { act, fireEvent, renderWithProviders } from "@/src/test-utils/renderWithProviders";
import type { LogEntry } from "@/src/types/log-entry";
import { formatLongDate } from "@/src/i18n/date";
import { LogEntryEditorModal } from "./LogEntryEditorModal";

// The native Android dialog can't run under Jest — stub it so `openDatePicker`
// can be exercised and its `onValueChange` callback driven manually. The iOS path
// (`DatePickerSheet`) renders the real component tree, no mock needed.
const mockAndroidOpen = jest.fn();
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: (...args: unknown[]) => mockAndroidOpen(...args) },
}));

async function setup(props: Partial<React.ComponentProps<typeof LogEntryEditorModal>> = {}) {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  const utils = await renderWithProviders(
    <LogEntryEditorModal
      visible
      title="Log Reading"
      submitLabel="Save"
      onClose={onClose}
      onSubmit={onSubmit}
      {...props}
    />
  );
  return { onClose, onSubmit, ...utils };
}

afterEach(() => {
  Platform.OS = "ios";
});

describe("LogEntryEditorModal — submit gating", () => {
  it("keeps submit disabled until a book is selected, then enables it", async () => {
    const { getByTestId, getByText } = await setup({ presetDate: "2026-01-05" });

    expect(getByTestId("entry-editor.save")).toBeDisabled();

    await fireEvent.press(getByTestId("entry-editor.book"));
    await fireEvent.press(getByText(Bible.getBookName(1, "en")));

    // Selecting a book seeds a whole-book default range, which is already a
    // valid passage — the user narrows it down from there.
    expect(getByTestId("entry-editor.save")).toBeEnabled();
  });
});

describe("LogEntryEditorModal — discard confirmation", () => {
  it("closes immediately when nothing has changed", async () => {
    const { getByText, onClose, queryByText } = await setup({ presetDate: "2026-01-05" });

    await fireEvent.press(getByText("Close"));

    expect(queryByText("Discard changes?")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("prompts to discard once the form has been edited, and respects Cancel/Discard", async () => {
    const { getByTestId, getByText, onClose } = await setup({ presetDate: "2026-01-05" });

    await fireEvent.press(getByTestId("entry-editor.book"));
    await fireEvent.press(getByText(Bible.getBookName(1, "en")));

    await fireEvent.press(getByText("Close"));
    expect(getByText("Discard changes?")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();

    await fireEvent.press(getByText("Cancel"));
    expect(onClose).not.toHaveBeenCalled();

    await fireEvent.press(getByText("Close"));
    await fireEvent.press(getByText("Discard"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("LogEntryEditorModal — date picker by platform", () => {
  it("opens the native Android dialog directly instead of the in-sheet picker", async () => {
    Platform.OS = "android";
    const { getByLabelText, queryByText } = await setup({ presetDate: "2026-01-05" });

    await fireEvent.press(getByLabelText("Date"));

    expect(mockAndroidOpen).toHaveBeenCalledTimes(1);
    expect(mockAndroidOpen.mock.calls[0][0]).toMatchObject({ mode: "date" });
    // The iOS spinner sheet never mounts.
    expect(queryByText("Done")).toBeNull();
  });

  it("applies the Android dialog's chosen date back onto the form", async () => {
    Platform.OS = "android";
    const { getByLabelText, getByText } = await setup({ presetDate: "2026-01-05" });

    await fireEvent.press(getByLabelText("Date"));
    const onValueChange = mockAndroidOpen.mock.calls[0][0].onValueChange;
    await act(() => onValueChange({}, new Date(2026, 0, 20)));

    expect(getByText(formatLongDate("2026-01-20", "en"))).toBeTruthy();
  });

  it("opens the in-sheet spinner picker on iOS instead of a native dialog", async () => {
    const { getByLabelText, getByText } = await setup({ presetDate: "2026-01-05" });

    await fireEvent.press(getByLabelText("Date"));

    expect(mockAndroidOpen).not.toHaveBeenCalled();
    expect(getByText("Done")).toBeTruthy();
  });
});

describe("LogEntryEditorModal — web date input", () => {
  it("renders a free-text date field instead of the tap-to-open selector", async () => {
    Platform.OS = "web";
    const { getByPlaceholderText, queryByLabelText } = await setup({ presetDate: "2026-01-05" });

    expect(queryByLabelText("Date")).toBeNull();
    expect(getByPlaceholderText("YYYY-MM-DD")).toBeTruthy();
  });
});

describe("LogEntryEditorModal — reset on open", () => {
  it("seeds fields from initialEntry", async () => {
    const initialEntry: LogEntry = {
      startVerseId: Bible.makeVerseId(43, 3, 16),
      endVerseId: Bible.makeVerseId(43, 3, 16),
      date: "2025-12-25",
    };
    const { getByText, onClose, queryByText } = await setup({ initialEntry });

    expect(getByText(Bible.getBookName(43, "en"))).toBeTruthy();
    expect(getByText(formatLongDate("2025-12-25", "en"))).toBeTruthy();
    expect(
      getByText(Bible.displayVerseRange(initialEntry.startVerseId, initialEntry.endVerseId))
    ).toBeTruthy();

    // A prefilled edit starts clean — closing shouldn't prompt to discard.
    await fireEvent.press(getByText("Close"));
    expect(queryByText("Discard changes?")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("seeds only the date from presetDate, leaving the book unselected", async () => {
    const { getByText, getByTestId } = await setup({ presetDate: "2025-06-01" });

    expect(getByText(formatLongDate("2025-06-01", "en"))).toBeTruthy();
    expect(getByText("Choose Book")).toBeTruthy();
    expect(getByTestId("entry-editor.save")).toBeDisabled();
  });

  it("re-seeds fields when reopened with different props", async () => {
    const initialEntry: LogEntry = {
      startVerseId: Bible.makeVerseId(43, 3, 16),
      endVerseId: Bible.makeVerseId(43, 3, 16),
      date: "2025-12-25",
    };
    const { getByText, queryByText, rerender } = await setup({
      visible: true,
      initialEntry,
    });
    expect(getByText(Bible.getBookName(43, "en"))).toBeTruthy();

    // Close it, then reopen fresh with only a preset date — the John 3:16
    // seed from the previous open should be gone.
    await rerender(
      <LogEntryEditorModal
        visible={false}
        title="Log Reading"
        submitLabel="Save"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        initialEntry={initialEntry}
      />
    );
    await rerender(
      <LogEntryEditorModal
        visible
        title="Log Reading"
        submitLabel="Save"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        presetDate="2025-06-01"
      />
    );

    expect(queryByText(Bible.getBookName(43, "en"))).toBeNull();
    expect(getByText(formatLongDate("2025-06-01", "en"))).toBeTruthy();
    expect(getByText("Choose Book")).toBeTruthy();
  });
});
