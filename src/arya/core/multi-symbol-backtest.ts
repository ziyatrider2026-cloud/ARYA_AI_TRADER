/** Deterministic multi-symbol portfolio replay. Orders execute on the next bar of each symbol. */
import type { Candle, OrderIntent } from "./types";
import { PaperSimulator, type SimulationCosts, type AccountState } from "./paper-simulator";

export interface SymbolReplay { symbol: string; candles: Candle[]; }
export interface PortfolioBacktestContext { timestamp: number; symbols: string[]; candles: Record<string, Candle>; state: AccountState; }
export type PortfolioStrategy = (context: PortfolioBacktestContext) => OrderIntent[];
export interface PortfolioBacktestResult { equityCurve: Array<{ t: number; equity: number }>; fills: Array<{ orderId: string; symbol: string; side: string; quantity: number; price: number; fee: number; realizedPnl: number; timestamp: number }>; finalState: AccountState; initialCash: number; finalEquity: number; returnPct: number; maxDrawdownPct: number; }

export function runPortfolioBacktest(series: SymbolReplay[], strategy: PortfolioStrategy, options: { initialCash: number; costs?: Partial<SimulationCosts> }): PortfolioBacktestResult {
  if (!series.length || series.some((s) => s.candles.length < 2)) throw new Error("each symbol requires at least two candles");
  const timeline = new Map<number, Record<string, Candle>>();
  for (const s of series) for (const candle of s.candles) { const row = timeline.get(candle.t) ?? {}; row[s.symbol] = candle; timeline.set(candle.t, row); }
  const times = [...timeline.keys()].sort((a, b) => a - b);
  const simulator = new PaperSimulator(options.initialCash, options.costs); const fills: PortfolioBacktestResult["fills"] = [];
  const equityCurve: PortfolioBacktestResult["equityCurve"] = [{ t: times[0]!, equity: options.initialCash }]; let peak = options.initialCash; let maxDrawdownPct = 0;
  for (let i = 0; i < times.length - 1; i++) {
    const t = times[i]!; const next = times[i + 1]!; const visible = timeline.get(t) ?? {};
    const state = simulator.snapshot(Object.fromEntries(Object.entries(visible).map(([symbol, c]) => [symbol, c.close])));
    for (const order of strategy({ timestamp: t, symbols: Object.keys(visible), candles: visible, state })) {
      const execution = timeline.get(next)?.[order.symbol];
      if (!execution) continue;
      const fill = simulator.fill(order, execution);
      if ("price" in fill) fills.push(fill);
    }
    const marks = Object.fromEntries(Object.entries(timeline.get(next) ?? {}).map(([symbol, candle]) => [symbol, candle.close]));
    const nextState = simulator.snapshot(marks); peak = Math.max(peak, nextState.equity); maxDrawdownPct = Math.max(maxDrawdownPct, peak <= 0 ? 0 : ((peak - nextState.equity) / peak) * 100); equityCurve.push({ t: next, equity: nextState.equity });
  }
  const finalMarks = Object.fromEntries(Object.entries(timeline.get(times[times.length - 1]!) ?? {}).map(([symbol, candle]) => [symbol, candle.close]));
  const finalState = simulator.snapshot(finalMarks); const net = finalState.equity - options.initialCash;
  return { equityCurve, fills, finalState, initialCash: options.initialCash, finalEquity: finalState.equity, returnPct: net / options.initialCash * 100, maxDrawdownPct };
}
