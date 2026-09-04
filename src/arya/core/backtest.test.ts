import { describe, expect, it } from "vitest";
import { runBacktest } from "./backtest";
import { PaperSimulator } from "./paper-simulator";
import type { Candle, OrderIntent } from "./types";

const candles: Candle[] = [
  { t: 1, open: 100, high: 110, low: 95, close: 105, volume: 10 },
  { t: 2, open: 105, high: 120, low: 100, close: 115, volume: 10 },
  { t: 3, open: 115, high: 125, low: 110, close: 120, volume: 10 },
];

const order = (id: string): OrderIntent => ({ id, symbol: "TEST", side: "long", quantity: 1, mode: "paper", proposalId: id, createdAt: 1 });

describe("PaperSimulator", () => {
  it("fills at the candle open with deterministic costs", () => {
    const sim = new PaperSimulator(10_000, { feeRate: 0, slippageBps: 0, spreadBps: 0 });
    const fill = sim.fill(order("o1"), candles[1]!);
    expect("price" in fill && fill.price).toBe(105);
  });

  it("accounts for long realized pnl and fees", () => {
    const sim = new PaperSimulator(10_000, { feeRate: 0.001, slippageBps: 0, spreadBps: 0 });
    sim.fill(order("open"), candles[1]!);
    sim.fill({ ...order("close"), side: "short" }, { ...candles[2], open: 120 });
    const state = sim.snapshot();
    expect(state.positions).toHaveLength(0);
    expect(state.realizedPnl).toBeCloseTo(14.755, 3);
    expect(state.feesPaid).toBeCloseTo(0.225, 6);
  });
});

describe("runBacktest", () => {
  it("does not allow a strategy to see the execution candle", () => {
    const seen: number[] = [];
    const result = runBacktest(candles, ({ index, candles: visible }) => {
      seen.push(visible.length);
      return index === 0 ? [order("o1")] : [];
    }, { initialCash: 10_000, costs: { feeRate: 0, slippageBps: 0, spreadBps: 0 } });
    expect(seen).toEqual([1, 2]);
    expect(result.fills[0]!.price).toBe(105);
  });

  it("is replayable", () => {
    const strategy = ({ index }: { index: number }) => index === 0 ? [order("same")] : [];
    const a = runBacktest(candles, strategy, { initialCash: 10_000, costs: { feeRate: 0, slippageBps: 0, spreadBps: 0 } });
    const b = runBacktest(candles, strategy, { initialCash: 10_000, costs: { feeRate: 0, slippageBps: 0, spreadBps: 0 } });
    expect(a.metrics).toEqual(b.metrics);
    expect(a.equityCurve).toEqual(b.equityCurve);
  });
});
