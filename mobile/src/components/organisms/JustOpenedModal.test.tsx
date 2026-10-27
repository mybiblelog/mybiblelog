import { Bible } from "@mybiblelog/shared";
import { act, fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { justOpenedActions, useJustOpenedStore } from "@/src/stores/justOpened";
import { JustOpenedModal } from "./JustOpenedModal";

const startVerseId = Bible.makeVerseId(43, 3, 16);
const endVerseId = Bible.makeVerseId(43, 3, 21);

describe("JustOpenedModal", () => {
  afterEach(async () => {
    await act(() => justOpenedActions.dismiss());
  });

  it("shows the opened passage and prompts to log it", async () => {
    const { getByText, queryByText } = await renderWithProviders(<JustOpenedModal />);
    expect(queryByText("Just Opened")).toBeNull();

    await act(() => justOpenedActions.openPrompt(startVerseId, endVerseId));

    const passage = Bible.displayVerseRange(startVerseId, endVerseId, "en");
    expect(getByText(`You opened ${passage} to read.`)).toBeTruthy();
    expect(getByText("Log Reading")).toBeTruthy();
  });

  it("clears the store when dismissed", async () => {
    const { getByText } = await renderWithProviders(<JustOpenedModal />);
    await act(() => justOpenedActions.openPrompt(startVerseId, endVerseId));

    await fireEvent.press(getByText("Dismiss"));

    expect(useJustOpenedStore.getState().open).toBe(false);
  });

  it("hands off to the log-entry editor from Log Reading", async () => {
    const { getByText, queryByText } = await renderWithProviders(<JustOpenedModal />);
    await act(() => justOpenedActions.openPrompt(startVerseId, endVerseId));

    await fireEvent.press(getByText("Log Reading"));

    // The prompt closes and the prefilled editor opens.
    expect(useJustOpenedStore.getState().open).toBe(false);
    await waitFor(() => expect(getByText("Add Log Entry")).toBeTruthy());
    expect(queryByText("Just Opened")).toBeNull();
  });

  it("hands off to the note editor from Take Note", async () => {
    const { getByText, queryByText } = await renderWithProviders(<JustOpenedModal />);
    await act(() => justOpenedActions.openPrompt(startVerseId, endVerseId));

    await fireEvent.press(getByText("Take Note"));

    // The prompt closes and the prefilled note editor opens.
    expect(useJustOpenedStore.getState().open).toBe(false);
    await waitFor(() => expect(getByText("New Note")).toBeTruthy());
    expect(queryByText("Just Opened")).toBeNull();
  });
});
