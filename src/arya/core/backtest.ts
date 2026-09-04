import type { Candle, OrderIntent } from "./types";
import { PaperSimulator, type AccountState, type Fill, type SimulationCosts } from "./paper-simulator";

export interface BacktestContext { index: number; candles: Candle[]; state: AccountState; }
export type BacktestStrategy = (context: BacktestContext) => OrderIntent[];
export type BacktestTrade = Fill;
export interface BacktestMetrics { initialCash: number; finalEquity: number; netPnl: number; returnPct: number; maxDrawdownPct: number; totalFills: number; winningClosedFills: number; losingClosedFills: number; feesPaid: number; }
export interface BacktestResult { metrics: BacktestMetrics; equityCurve: Array<{ t: number; equity: number }>; fills: BacktestTrade[]; finalState: AccountState; }

function drawdownPct(equity: number, peak: number): number { return peak <= 0 ? 0 : ((peak - equity) / peak) * 100; }
function marks(state: AccountState, close: number): Record<string, number> { return Object.fromEntries(state.positions.map((p) => [p.symbol, close])); }

export function runBacktest(candles: Candle[], strategy: BacktestStrategy, options: { initialCash: number; costs?: Partial<SimulationCosts> }): BacktestResult {
  if (candles.length < 2) throw new Error("at least two candles are required");
  const simulator = new PaperSimulator(options.initialCash, options.costs); const fills: BacktestTrade[] = [];
  const equityCurve: Array<{ t: number; equity: number }> = [{ t: candles[0]!.t, equity: options.initialCash }]; let peak = options.initialCash; let maxDrawdown = 0;
  // The strategy sees only candles that closed before the execution bar. Orders execute on the next bar.
  for (let i = 0; i < candles.length - 1; i++) {
    const visible = candles.slice(0, i + 1); const context = { index: i, candles: visible, state: simulator.snapshot(marks(simulator.snapshot(), candles[i]!.close)) };
    for (const order of strategy(context)) { const fill = simulator.fill(order, candles[i + 1]!); if ("price" in fill) fills.push(fill); }
    const state = simulator.snapshot(marks(simulator.snapshot(), candles[i + 1]!.close)); peak = Math.max(peak, state.equity); maxDrawdown = Math.max(maxDrawdown, drawdownPct(state.equity, peak)); equityCurve.push({ t: candles[i + 1]!.t, equity: state.equity });
  }
  const finalState = simulator.snapshot(marks(simulator.snapshot(), candles[candles.length - 1]!.close)); const netPnl = finalState.equity - options.initialCash;
  return { metrics: { initialCash: options.initialCash, finalEquity: finalState.equity, netPnl, returnPct: (netPnl / options.initialCash) * 100, maxDrawdownPct: maxDrawdown, totalFills: fills.length, winningClosedFills: fills.filter((f) => f.realizedPnl > 0).length, losingClosedFills: fills.filter((f) => f.realizedPnl < 0).length, feesPaid: finalState.feesPaid }, equityCurve, fills, finalState };
}
