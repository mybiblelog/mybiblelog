import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import {
  DEFAULT_CHART_DIMENSIONS,
  buildLineChartGeometry,
  computeDailyVerseSeries,
  type InsightsLogEntry,
} from "@mybiblelog/shared";
import { spacing, useTheme } from "@/src/design";
import { SelectRow } from "../molecules/SelectRow";
import { SelectSheet } from "./SelectSheet";
import { formatLongDate } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";

const WINDOW_OPTIONS = [7, 14, 30, 60, 90, 180, 365];
const METRICS = [
  { value: "daily", labelKey: "insights_trend_metric_daily", window: 1 },
  { value: "avg3", labelKey: "insights_trend_metric_avg3", window: 3 },
  { value: "avg7", labelKey: "insights_trend_metric_avg7", window: 7 },
] as const;
type Metric = (typeof METRICS)[number]["value"];
const { width, height, padLeft, padRight } = DEFAULT_CHART_DIMENSIONS;

export function DailyVersesChart({ entries }: { entries: InsightsLogEntry[] }) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const [days, setDays] = useState(30);
  const [metric, setMetric] = useState<Metric>("daily");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [metricSheetOpen, setMetricSheetOpen] = useState(false);

  const windowOptions = WINDOW_OPTIONS.map((n) => ({
    value: n,
    label: t("insights_trend_last_n_days", { count: n }),
  }));

  const metricOptions = METRICS.map((m) => ({ value: m.value, label: t(m.labelKey) }));
  const averageWindow = METRICS.find((m) => m.value === metric)?.window ?? 1;

  const series = useMemo(
    () => computeDailyVerseSeries(entries, days, undefined, averageWindow),
    [entries, days, averageWindow]
  );
  const geometry = useMemo(() => buildLineChartGeometry(series), [series]);
  const showPoints = series.length <= 60;

  const firstLabel = series[0] ? formatLongDate(series[0].date, locale) : "";
  const lastLabel = series[series.length - 1]
    ? formatLongDate(series[series.length - 1]!.date, locale)
    : "";

  return (
    <View style={styles.container}>
      <SelectRow
        label={t("insights_trend_window_label")}
        value={windowOptions.find((o) => o.value === days)?.label}
        placeholder={t("insights_trend_window_label")}
        onPress={() => setSheetOpen(true)}
        testID="insights.trend-window-row"
      />
      <SelectRow
        label={t("insights_trend_metric_label")}
        value={metricOptions.find((o) => o.value === metric)?.label}
        placeholder={t("insights_trend_metric_label")}
        onPress={() => setMetricSheetOpen(true)}
        testID="insights.trend-metric-row"
      />

      <Svg
        testID="insights.trend-chart"
        width="100%"
        height={220}
        viewBox={`0 0 ${width} ${height}`}
        accessibilityLabel={t(averageWindow > 1 ? "insights_trend_chart_label_avg" : "insights_trend_chart_label")}
      >
        {/* Ticks are a fixed positional ladder, so they key by index: their
            values are whole verse counts and repeat once the max is small. */}
        {geometry.yTicks.map((tick, i) => (
          <Line
            key={`g-${i}`}
            x1={padLeft}
            y1={tick.y}
            x2={width - padRight}
            y2={tick.y}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {geometry.yTicks.map((tick, i) => (
          <SvgText
            key={`t-${i}`}
            x={padLeft - 6}
            y={tick.y + 3}
            fontSize={11}
            fill={colors.mutedText}
            textAnchor="end"
          >
            {tick.value}
          </SvgText>
        ))}

        <Path
          testID="insights.trend-area"
          d={geometry.areaPath}
          fill={colors.success}
          opacity={0.12}
        />
        <Path
          testID="insights.trend-line"
          d={geometry.linePath}
          fill="none"
          stroke={colors.success}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {showPoints &&
          geometry.points.map((pt) => (
            <Circle key={pt.date} cx={pt.x} cy={pt.y} r={2.5} fill={colors.success} />
          ))}

        <SvgText
          x={padLeft}
          y={height - 4}
          fontSize={11}
          fill={colors.mutedText}
          textAnchor="start"
        >
          {firstLabel}
        </SvgText>
        <SvgText
          x={width - padRight}
          y={height - 4}
          fontSize={11}
          fill={colors.mutedText}
          textAnchor="end"
        >
          {lastLabel}
        </SvgText>
      </Svg>

      <SelectSheet
        visible={sheetOpen}
        title={t("insights_trend_window_label")}
        options={windowOptions}
        selectedValue={days}
        onSelect={setDays}
        onClose={() => setSheetOpen(false)}
      />
      <SelectSheet
        visible={metricSheetOpen}
        title={t("insights_trend_metric_label")}
        options={metricOptions}
        selectedValue={metric}
        onSelect={setMetric}
        onClose={() => setMetricSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});
