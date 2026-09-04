import type { Candle } from "./types";

export interface ChartCandle extends Candle {
  label: string;
  ma20: number;
  ma50: number;
  rsi: number;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function rsi(closes: number[], period = 14): number {
  if (closes.length < 2) return 50;
  const window = closes.slice(-(period + 1));
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < window.length; i++) {
    const delta = window[i]! - window[i - 1]!;
    if (delta >= 0) gain += delta;
    else loss -= delta;
  }
  if (loss === 0) return gain === 0 ? 50 : 100;
  return 100 - 100 / (1 + gain / loss);
}

function labelFor(timestamp: number): string {
  return new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(new Date(timestamp));
}

/** Converts canonical market candles into the fields required by the chart UI. */
export function toChartSeries(candles: Candle[]): ChartCandle[] {
  const closes: number[] = [];
  return candles.map((candle) => {
    closes.push(candle.close);
    return {
      ...candle,
      label: labelFor(candle.t),
      ma20: average(closes.slice(-20)),
      ma50: average(closes.slice(-50)),
      rsi: rsi(closes),
    };
  });
}
