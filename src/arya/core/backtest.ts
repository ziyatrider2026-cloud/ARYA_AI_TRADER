import type { Candle, OrderIntent, Side } from "./types";
import { PaperSimulator, type AccountState, type Fill, type SimulationCosts } from "./paper-simulator";

export interface BacktestContext { index: number; candles: Candle[]; state: AccountState; }
export type BacktestStrategy = (context: BacktestContext) => OrderIntent[];
export type BacktestTrade = Fill;
export interface BacktestMetrics { initialCash: number; finalEquity: number; netPnl: number; returnPct: number; maxDrawdownPct: number; totalFills: number; winningClosedFills: number; losingClosedFills: number; feesPaid: number; }
export interface BacktestResult { metrics: BacktestMetrics; equityCurve: Array<{ t: number; equity: number }>; fills: BacktestTrade[]; finalState: AccountState; }

type Protection = { side: Side; quantity: number; stopLoss?: number; takeProfit?: number };
function drawdownPct(equity: number, peak: number): number { return peak <= 0 ? 0 : ((peak - equity) / peak) * 100; }
function marks(state: AccountState, close: number): Record<string, number> { return Object.fromEntries(state.positions.map((p) => [p.symbol, close])); }
function protectiveExit(position: Protection, candle: Candle): number | undefined {
  const stop = position.stopLoss;
  const target = position.takeProfit;
  if (position.side === "long") {
    // If both are touched in one OHLC bar, choose the stop first: conservative and deterministic.
    if (stop !== undefined && candle.low <= stop) return stop;
    if (target !== undefined && candle.high >= target) return target;
  } else {
    if (stop !== undefined && candle.high >= stop) return stop;
    if (target !== undefined && candle.low <= target) return target;
  }
  return undefined;
}

export function runBacktest(candles: Candle[], strategy: BacktestStrategy, options: { initialCash: number; costs?: Partial<SimulationCosts> }): BacktestResult {
  if (candles.length < 2) throw new Error("at least two candles are required");
  const simulator = new PaperSimulator(options.initialCash, options.costs);
  const fills: BacktestTrade[] = [];
  const protections = new Map<string, Protection>();
  const equityCurve: Array<{ t: number; equity: number }> = [{ t: candles[0]!.t, equity: options.initialCash }];
  let peak = options.initialCash; let maxDrawdown = 0;

  for (let i = 0; i < candles.length - 1; i++) {
    const executionCandle = candles[i + 1]!;
    // Protective exits are evaluated from the execution candle's high/low only after
    // the position existed before this candle. They never use a future candle.
    for (const [symbol, protection] of protections) {
      const position = simulator.snapshot().positions.find((p) => p.symbol === symbol);
      if (!position) { protections.delete(symbol); continue; }
      const exitPrice = protectiveExit(protection, executionCandle);
      if (exitPrice !== undefined) {
        const exit: OrderIntent = { id: `protect-${symbol}-${executionCandle.t}-${protection.side}`, symbol, side: protection.side === "long" ? "short" : "long", quantity: Math.min(position.quantity, protection.quantity), entry: exitPrice, mode: "paper", proposalId: "protective-exit", createdAt: executionCandle.t };
        const fill = simulator.fill(exit, executionCandle); if ("price" in fill) fills.push(fill); protections.delete(symbol);
      }
    }

    const visible = candles.slice(0, i + 1);
    const context = { index: i, candles: visible, state: simulator.snapshot(marks(simulator.snapshot(), candles[i]!.close)) };
    for (const order of strategy(context)) {
      const fill = simulator.fill(order, executionCandle);
      if ("price" in fill) {
        fills.push(fill);
        protections.set(order.symbol, { side: order.side, quantity: order.quantity, stopLoss: order.stopLoss, takeProfit: order.takeProfit });
      }
    }
    const state = simulator.snapshot(marks(simulator.snapshot(), executionCandle.close));
    peak = Math.max(peak, state.equity); maxDrawdown = Math.max(maxDrawdown, drawdownPct(state.equity, peak)); equityCurve.push({ t: executionCandle.t, equity: state.equity });
  }

  const finalState = simulator.snapshot(marks(simulator.snapshot(), candles[candles.length - 1]!.close));
  const netPnl = finalState.equity - options.initialCash;
  return { metrics: { initialCash: options.initialCash, finalEquity: finalState.equity, netPnl, returnPct: (netPnl / options.initialCash) * 100, maxDrawdownPct: maxDrawdown, totalFills: fills.length, winningClosedFills: fills.filter((f) => f.realizedPnl > 0).length, losingClosedFills: fills.filter((f) => f.realizedPnl < 0).length, feesPaid: finalState.feesPaid }, equityCurve, fills, finalState };
}
