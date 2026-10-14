jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useFocusEffect: jest.fn(),
}));

import { Ionicons } from "@expo/vector-icons";
import { Bible } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import type { ReactTestInstance } from "react-test-renderer";
import Calendar from "@/app/(tabs)/calendar";
import { colorsByScheme } from "@/src/design";
import { useAuthStore } from "@/src/stores/auth";
import { useDateVerseCountsStore } from "@/src/stores/dateVerseCounts";
import { useLogEntriesStore } from "@/src/stores/logEntries";
import { useUserSettingsStore } from "@/src/stores/userSettings";
import {
  fireEvent,
  renderWithProviders,
  screen,
  within,
} from "@/src/test-utils/renderWithProviders";

const DAY_CELL = /^calendar\.day-cell\./;

beforeEach(() => {
  useAuthStore.setState({ state: { status: "authenticated", user: { id: "u1" } } } as never);
  useLogEntriesStore.setState({
    state: { status: "ready", entries: [], isSyncing: false },
  });
  useUserSettingsStore.setState({
    readingTrackerResetDelayed: false,
    state: {
      status: "ready",
      settings: {
        lookBackDate: "2026-01-01",
        dailyVerseCountGoal: 50,
        preferredBibleVersion: "kjv",
        preferredBibleApp: "",
      },
      isRefreshingFromServer: false,
    },
  });
  useDateVerseCountsStore.setState({ jobs: 0, dateVerseCounts: {} });
});

describe("Calendar grid", () => {
  // The grid used to compute cell widths from the window width while applying a
  // margin to all seven cells, so at some widths (360dp among them) the seventh
  // cell overflowed and Yoga wrapped it into a sixth column.
  it("always lays out seven day cells per week row", () => {
    renderWithProviders(<Calendar />);

    const rows = screen.getAllByTestId("calendar.week-row");
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const row of rows) {
      expect(within(row).getAllByTestId(DAY_CELL)).toHaveLength(7);
    }
  });

  it("renders every day of the current month, including today", () => {
    const today = dayjs();
    renderWithProviders(<Calendar />);

    expect(screen.getByTestId(`calendar.day-cell.${today.format("YYYY-MM-DD")}`)).toBeTruthy();
    expect(screen.getAllByTestId(DAY_CELL).length).toBe(
      screen.getAllByTestId("calendar.week-row").length * 7
    );
  });

  // Cells are shaped by background color + radius, not table-style borders.
  it("draws no border on the day cells themselves", () => {
    renderWithProviders(<Calendar />);

    for (const cell of screen.getAllByTestId(DAY_CELL)) {
      const style = StyleSheet.flatten(cell.props.style);
      expect(style.borderWidth).toBeUndefined();
      expect(style.margin ?? style.marginRight ?? style.marginBottom).toBeUndefined();
    }
  });

  // Every cell is "somewhat rounded" on every corner, but the four corners of
  // the whole month (the outward-facing corner of each of the 4 corner cells)
  // get an extra-large radius so the grid reads as one rounded block.
  it("rounds every cell, with extra rounding on the four outer corners", () => {
    renderWithProviders(<Calendar />);

    const rows = screen.getAllByTestId("calendar.week-row");
    const cornerOf = (row: ReactTestInstance, column: 0 | 6) =>
      StyleSheet.flatten(within(row).getAllByTestId(DAY_CELL)[column].props.style as ViewStyle);

    const first = rows[0];
    const last = rows[rows.length - 1];
    const outerTopLeft = cornerOf(first, 0).borderTopLeftRadius as number;
    const outerTopRight = cornerOf(first, 6).borderTopRightRadius as number;
    const outerBottomLeft = cornerOf(last, 0).borderBottomLeftRadius as number;
    const outerBottomRight = cornerOf(last, 6).borderBottomRightRadius as number;
    expect(outerTopLeft).toBeGreaterThan(0);
    expect(outerTopRight).toBeGreaterThan(0);
    expect(outerBottomLeft).toBeGreaterThan(0);
    expect(outerBottomRight).toBeGreaterThan(0);

    // An interior cell is still rounded on every corner, but by less.
    const interior = cornerOf(rows[1], 0);
    expect(interior.borderTopLeftRadius).toBeGreaterThan(0);
    expect(interior.borderTopLeftRadius).toBeLessThan(outerTopLeft);
    expect(interior.borderBottomLeftRadius).toBeGreaterThan(0);
    expect(interior.borderBottomLeftRadius).toBeLessThan(outerTopLeft);

    // Even the corner cells stay small on their inward-facing corners.
    const topLeftCell = cornerOf(first, 0);
    expect(topLeftCell.borderTopRightRadius).toBe(interior.borderTopLeftRadius);
    expect(topLeftCell.borderBottomLeftRadius).toBe(interior.borderTopLeftRadius);
  });

  // The header used a fixed pixel width while the cells carried an extra
  // margin, so labels drifted left of their column by up to 6px. Both rows now
  // have to derive columns from the same flex + gap geometry.
  it("aligns the weekday header to the day columns", () => {
    renderWithProviders(<Calendar />);

    const header = screen.getByTestId("calendar.weekdays-row");
    const headerStyle = StyleSheet.flatten(header.props.style);
    const weekStyle = StyleSheet.flatten(screen.getAllByTestId("calendar.week-row")[0].props.style);
    const gridStyle = StyleSheet.flatten(screen.getByTestId("calendar.days-grid").props.style);

    expect(headerStyle.gap).toBe(weekStyle.gap);
    expect(headerStyle.gap).toBe(gridStyle.gap);
    expect(headerStyle.marginHorizontal).toBe(gridStyle.marginHorizontal);

    const labels = header.children as ReactTestInstance[];
    expect(labels).toHaveLength(7);
    for (const label of labels) {
      const style = StyleSheet.flatten(label.props.style as ViewStyle);
      expect(style.flex).toBe(1);
      expect(style.width).toBeUndefined();
    }
  });
});

describe("Calendar day selection", () => {
  // A day other than today, guaranteed to stay inside the currently-rendered
  // month grid without any month navigation.
  const today = dayjs();
  const selectedDate = (today.date() === 1 ? today.date(2) : today.date(1)).format("YYYY-MM-DD");

  const start = Bible.makeVerseId(1, 1, 1);
  const end = Bible.makeVerseId(1, 1, 31);
  const range = Bible.displayVerseRange(start, end);

  beforeEach(() => {
    useLogEntriesStore.setState({
      state: {
        status: "ready",
        entries: [{ clientId: "c1", date: selectedDate, startVerseId: start, endVerseId: end }],
        isSyncing: false,
      },
    });
  });

  it("shows the selected day's entries and verse count when a day cell is pressed", () => {
    renderWithProviders(<Calendar />, { scheme: "light" });

    fireEvent.press(screen.getByTestId(`calendar.day-cell.${selectedDate}`));

    expect(screen.getByText(range)).toBeTruthy();
    const verseCount = Bible.countRangeVerses(start, end);
    expect(screen.getByText(`${verseCount} verses`)).toBeTruthy();
  });

  it("shows a gold star when the day's unique verse count meets the daily goal", () => {
    useDateVerseCountsStore.setState({
      jobs: 0,
      dateVerseCounts: { [selectedDate]: { total: 50, unique: 50 } },
    });
    renderWithProviders(<Calendar />, { scheme: "light" });

    const cell = screen.getByTestId(`calendar.day-cell.${selectedDate}`);
    const star = within(cell).UNSAFE_getByType(Ionicons);
    expect(star.props.name).toBe("star");
    expect(star.props.color).toBe(colorsByScheme.light.starGold);
  });

  it("shows a blue star when only the total verse count meets the daily goal", () => {
    useDateVerseCountsStore.setState({
      jobs: 0,
      dateVerseCounts: { [selectedDate]: { total: 50, unique: 10 } },
    });
    renderWithProviders(<Calendar />, { scheme: "light" });

    const cell = screen.getByTestId(`calendar.day-cell.${selectedDate}`);
    const star = within(cell).UNSAFE_getByType(Ionicons);
    expect(star.props.name).toBe("star");
    expect(star.props.color).toBe(colorsByScheme.light.secondary);
  });

  it("shows no star when neither count meets the daily goal", () => {
    useDateVerseCountsStore.setState({
      jobs: 0,
      dateVerseCounts: { [selectedDate]: { total: 10, unique: 5 } },
    });
    renderWithProviders(<Calendar />, { scheme: "light" });

    const cell = screen.getByTestId(`calendar.day-cell.${selectedDate}`);
    expect(within(cell).UNSAFE_queryAllByType(Ionicons)).toHaveLength(0);
  });
});
