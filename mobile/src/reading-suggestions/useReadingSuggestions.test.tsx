import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react-native";
import { LocaleProvider } from "@/src/i18n/LocaleProvider";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import { useReadingSuggestions } from "./useReadingSuggestions";

const wrapper = ({ children }: { children: ReactNode }) => (
  <LocaleProvider>{children}</LocaleProvider>
);

const today = dayjs().format("YYYY-MM-DD");
const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

const entry = (
  clientId: string,
  date: string,
  startVerseId: number,
  endVerseId: number
): StoredLogEntry => ({ clientId, date, startVerseId, endVerseId });

describe("useReadingSuggestions", () => {
  it("maps reading-path suggestions to translated messages", () => {
    const { result } = renderHook(() => useReadingSuggestions([], today), { wrapper });

    expect(result.current).toHaveLength(3);
    expect(result.current[0]!.passageLabel).toBe("Matthew 1");
    expect(result.current[0]!.contextMessage).toBe("Read something new in the New Testament");
    expect(result.current[1]!.contextMessage).toBe("Read something new in the Old Testament");
    expect(result.current[2]!.contextMessage).toBe("Read something new in the Wisdom books");
  });

  it("maps continue-suggestions to a capitalized last-read message", () => {
    const entries = [
      entry("c1", yesterday, Bible.makeVerseId(1, 1, 1), Bible.makeVerseId(1, 1, 31)),
    ];
    const { result } = renderHook(() => useReadingSuggestions(entries, today), { wrapper });

    const first = result.current[0]!;
    expect(first.passageLabel).toBe("Genesis 2");
    expect(first.contextMessage).toContain("you read Genesis 1");
    expect(first.contextMessage.charAt(0)).toBe(first.contextMessage.charAt(0).toUpperCase());
  });

  it("computes the new-verse count net of verses already read", () => {
    // Matthew 1 has 25 verses; 10 were already read today, so the NT path
    // suggestion (still Matthew 1 — the chapter is incomplete) adds 15.
    const entries = [entry("c1", today, Bible.makeVerseId(40, 1, 1), Bible.makeVerseId(40, 1, 10))];
    const { result } = renderHook(() => useReadingSuggestions(entries, today), { wrapper });

    const nt = result.current.find((s) => s.contextMessage.includes("New Testament"));
    expect(nt?.passageLabel).toBe("Matthew 1");
    expect(nt?.newVerseCount).toBe(Bible.getChapterVerseCount(40, 1) - 10);
  });
});
