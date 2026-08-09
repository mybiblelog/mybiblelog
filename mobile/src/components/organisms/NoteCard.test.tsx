jest.mock("@/src/bible/openInBible", () => ({
  openPassageInBible: jest.fn(),
}));

import { Bible } from "@mybiblelog/shared";
import { StyleSheet } from "react-native";
import { openPassageInBible } from "@/src/bible/openInBible";
import type { PassageNote } from "@/src/api/notesApi";
import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { NoteCard } from "./NoteCard";

const note: PassageNote = {
  id: "n1",
  content: "In the beginning…",
  passages: [
    {
      startVerseId: Bible.makeVerseId(1, 1, 1),
      endVerseId: Bible.makeVerseId(1, 1, 5),
    },
  ],
  tags: [],
};

describe("NoteCard", () => {
  it("opens a passage in the Bible app when pressed", async () => {
    (openPassageInBible as jest.Mock).mockResolvedValue(true);
    const { getByRole } = renderWithProviders(<NoteCard note={note} onPressMenu={jest.fn()} />);

    fireEvent.press(getByRole("link"));

    await waitFor(() =>
      expect(openPassageInBible).toHaveBeenCalledWith(
        Bible.makeVerseId(1, 1, 1),
        Bible.makeVerseId(1, 1, 5),
        expect.any(Object)
      )
    );
  });

  it("still opens the note menu from the menu button", () => {
    const onPressMenu = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <NoteCard note={note} onPressMenu={onPressMenu} />
    );

    fireEvent.press(getByLabelText("Note actions"));

    expect(onPressMenu).toHaveBeenCalledWith(note);
  });

  it("keeps the menu button on the right edge when the note has no passages", () => {
    const { getByLabelText } = renderWithProviders(
      <NoteCard note={{ ...note, passages: [] }} onPressMenu={jest.fn()} />
    );

    // Without a passage list to take up the slack, only `marginLeft: auto`
    // keeps the menu off the left edge.
    const style = StyleSheet.flatten(getByLabelText("Note actions").props.style);
    expect(style.marginLeft).toBe("auto");
  });
});
