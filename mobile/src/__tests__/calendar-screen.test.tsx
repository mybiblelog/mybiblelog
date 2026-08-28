jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useFocusEffect: jest.fn(),
}));

import dayjs from "dayjs";
import { StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import type { ReactTestInstance } from "react-test-renderer";
import Calendar from "@/app/(tabs)/calendar";
import { useAuthStore } from "@/src/stores/auth";
import { useDateVerseCountsStore } from "@/src/stores/dateVerseCounts";
import { useLogEntriesStore } from "@/src/stores/logEntries";
import { useUserSettingsStore } from "@/src/stores/userSettings";
import { renderWithProviders, screen, within } from "@/src/test-utils/renderWithProviders";

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

  // Borders are collapsed by painting the container and letting it show through
  // 1px gaps. A border back on a cell would double every rule between cells.
  it("draws no border on the day cells themselves", () => {
    renderWithProviders(<Calendar />);

    for (const cell of screen.getAllByTestId(DAY_CELL)) {
      const style = StyleSheet.flatten(cell.props.style);
      expect(style.borderWidth).toBeUndefined();
      expect(style.margin ?? style.marginRight ?? style.marginBottom).toBeUndefined();
    }
  });

  // The frame is the container's background showing through a 1px inset, so a
  // square corner cell clips the curve and the rule reads as a blunt diagonal
  // cut. The four corner cells have to carry the frame's radius, less the rule.
  it("rounds the four corner cells to follow the frame", () => {
    renderWithProviders(<Calendar />);

    const rows = screen.getAllByTestId("calendar.week-row");
    const cornerOf = (row: ReactTestInstance, column: 0 | 6) =>
      StyleSheet.flatten(within(row).getAllByTestId(DAY_CELL)[column].props.style as ViewStyle);

    const first = rows[0];
    const last = rows[rows.length - 1];
    expect(cornerOf(first, 0).borderTopLeftRadius).toBeGreaterThan(0);
    expect(cornerOf(first, 6).borderTopRightRadius).toBeGreaterThan(0);
    expect(cornerOf(last, 0).borderBottomLeftRadius).toBeGreaterThan(0);
    expect(cornerOf(last, 6).borderBottomRightRadius).toBeGreaterThan(0);

    // ...and only those four. An interior cell stays square on every corner.
    const interior = cornerOf(rows[1], 0);
    expect(interior.borderTopLeftRadius).toBe(0);
    expect(interior.borderBottomLeftRadius).toBe(0);
  });

  // The container no longer clips, so nothing hides a cell that overflows it.
  it("keeps the corner radius smaller than the frame's", () => {
    renderWithProviders(<Calendar />);

    const gridStyle = StyleSheet.flatten(screen.getByTestId("calendar.days-grid").props.style);
    const corner = StyleSheet.flatten(
      within(screen.getAllByTestId("calendar.week-row")[0]).getAllByTestId(DAY_CELL)[0].props
        .style as ViewStyle
    );
    expect(corner.borderTopLeftRadius).toBe(
      (gridStyle.borderRadius as number) - (gridStyle.padding as number)
    );
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
    expect(headerStyle.paddingHorizontal).toBe(gridStyle.padding);
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
