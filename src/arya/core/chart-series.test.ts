import { describe, expect, it } from "vitest";
import { toChartSeries } from "./chart-series";
import type { Candle } from "./types";

const candles: Candle[] = Array.from({ length: 20 }, (_, index) => ({
  t: Date.UTC(2026, 0, index + 1),
  open: 100 + index,
  high: 102 + index,
  low: 99 + index,
  close: 101 + index,
  volume: 1_000 + index,
}));

describe("toChartSeries", () => {
  it("preserves canonical OHLCV data and derives presentation fields", () => {
    const result = toChartSeries(candles);
    expect(result).toHaveLength(20);
    expect(result[19]).toMatchObject(candles[19]!);
    expect(result[19]?.ma20).toBeCloseTo(110.5, 8);
    expect(result[19]?.ma50).toBeCloseTo(110.5, 8);
    expect(result[19]?.rsi).toBe(100);
    expect(result[19]?.label).toBeTruthy();
  });

  it("does not mutate the source candle array", () => {
    const source = candles.map((candle) => ({ ...candle }));
    toChartSeries(source);
    expect(source).toEqual(candles);
  });
});
