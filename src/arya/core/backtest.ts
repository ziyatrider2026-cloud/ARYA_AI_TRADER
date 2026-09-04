import type { Candle, OrderIntent } from "./types";
import { PaperSimulator, type AccountState, type Fill, type SimulationCosts } from "./paper-simulator";

export interface BacktestContext { index: number; candles: Candle[]; state: AccountState; }
export type BacktestStrategy = (context: BacktestContext) => OrderIntent[];

export interface BacktestTrade extends Fill { pnl?: number; }
export interface BacktestMetrics { initialCash: number; finalEquity: number; netPnl: number; returnPct: number; maxDrawdownPct: number; totalTrades: number; winningTrades: number; losingTrades: number; feesPaid: number; }
export interface BacktestResult { metrics: BacktestMetrics; equityCurve: Array<{ t: number; equity: number }>; fills: BacktestTrade[]; finalState: AccountState; }

function drawdownPct(equity: number, peak: number): number { return peak <= 0 ? 0 : ((peak - equity) / peak) * 100; }

export function runBacktest(
  candles: Candle[],
  strategy: BacktestStrategy,
  options: { initialCash: number; costs?: Partial<SimulationCosts> },
): BacktestResult {
  if (candles.length < 2) throw new Error("at least two candles are required");
  const simulator = new PaperSimulator(options.initialCash, options.costs);
  const fills: BacktestTrade[] = [];
  const equityCurve: Array<{ t: number; equity: number }> = [{ t: candles[0]!.t, equity: options.initialCash }];
  let peak = options.initialCash;
  let maxDrawdown = 0;

  // A strategy sees only completed candles before the execution candle.
  // Orders generated at i are filled on candle i+1, preventing lookahead.
  for (let i = 0; i < candles.length - 1; i++) {
    const mark = candles[i]!;
    const context = { index: i, candles: candles.slice(0, i + 1), state: simulator.snapshot({}) };
    const orders = strategy(context);
    for (const order of orders) {
      const fill = simulator.fill(order, candles[i + 1]!);
      if ("price" in fill) fills.push(fill);
    }
    const next = candles[i + 1]!;
    const state = simulator.snapshot({ [orders[0]?.symbol ?? "__none__"]: next.close });
    peak = Math.max(peak, state.equity);
    maxDrawdown = Math.max(maxDrawdown, drawdownPct(state.equity, peak));
    equityCurve.push({ t: next.t, equity: state.equity });
  }

  const finalState = simulator.snapshot();
  const finalEquity = finalState.equity;
  const netPnl = finalEquity - options.initialCash;
  const winningTrades = fills.filter((f) => (f.pnl ?? 0) > 0).length;
  const losingTrades = fills.filter((f) => (f.pnl ?? 0) < 0).length;
  return {
    metrics: {
      initialCash: options.initialCash,
      finalEquity,
      netPnl,
      returnPct: (netPnl / options.initialCash) * 100,
      maxDrawdownPct: maxDrawdown,
      totalTrades: fills.length,
      winningTrades,
      losingTrades,
      feesPaid: finalState.feesPaid,
    },
    equityCurve,
    fills,
    finalState,
  };
}
