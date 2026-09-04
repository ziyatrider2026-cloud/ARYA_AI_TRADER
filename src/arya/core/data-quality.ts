import type { Candle, Timeframe } from "./types";
import { TIMEFRAME_MS } from "./types";

export interface RawCandle {
  t: unknown;
  open: unknown;
  high: unknown;
  low: unknown;
  close: unknown;
  volume: unknown;
}

export interface CandleValidation {
  candles: Candle[];
  status: "ok" | "partial" | "invalid";
  coverage: number;
  warnings: string[];
}

function finite(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function normalizeCandle(raw: RawCandle): Candle | null {
  const t = finite(raw.t);
  const open = finite(raw.open);
  const high = finite(raw.high);
  const low = finite(raw.low);
  const close = finite(raw.close);
  const volume = finite(raw.volume);
  if ([t, open, high, low, close, volume].some((v) => v === null)) return null;
  if (t! < 0 || open! <= 0 || high! <= 0 || low! <= 0 || close! <= 0 || volume! < 0) return null;
  if (high! < Math.max(open!, close!) || low! > Math.min(open!, close!) || low! > high!) return null;
  return { t: t!, open: open!, high: high!, low: low!, close: close!, volume: volume! };
}

export function validateCandles(candles: Candle[], timeframe: Timeframe, expectedLimit?: number): CandleValidation {
  const warnings: string[] = [];
  if (!candles.length) return { candles: [], status: "invalid", coverage: 0, warnings: ["no candles returned"] };
  const step = TIMEFRAME_MS[timeframe];
  const sorted = [...candles].sort((a, b) => a.t - b.t);
  const deduped: Candle[] = [];
  const seen = new Set<number>();
  for (const candle of sorted) {
    if (seen.has(candle.t)) { warnings.push(`duplicate candle timestamp ${candle.t}`); continue; }
    seen.add(candle.t);
    deduped.push(candle);
  }
  for (let i = 1; i < deduped.length; i++) {
    const delta = deduped[i]!.t - deduped[i - 1]!.t;
    if (delta !== step) warnings.push(`timeframe gap/overlap at ${deduped[i]!.t}: expected ${step}ms, got ${delta}ms`);
  }
  const coverage = expectedLimit ? Math.min(1, deduped.length / expectedLimit) : 1;
  if (coverage < 1) warnings.push(`requested ${expectedLimit} candles but received ${deduped.length}`);
  return { candles: deduped, status: warnings.length ? "partial" : "ok", coverage, warnings };
}
