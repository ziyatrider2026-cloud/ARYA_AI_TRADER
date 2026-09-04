import { describe, expect, it } from "vitest";
import { runPortfolioBacktest } from "./multi-symbol-backtest";
import type { Candle, OrderIntent } from "./types";

const series = (symbol: string, prices: number[]) => ({ symbol, candles: prices.map((p, i): Candle => ({ t: i + 1, open: p, high: p + 2, low: p - 2, close: p + 1, volume: 100 })) });
const buy = (symbol: string): OrderIntent => ({ id: `buy-${symbol}`, symbol, side: "long", quantity: 1, mode: "paper", proposalId: `p-${symbol}`, createdAt: 1 });

describe("runPortfolioBacktest", () => {
  it("replays multiple symbols and executes on their next bar", () => {
    const result = runPortfolioBacktest([series("A", [100, 110, 120]), series("B", [50, 55, 60])], ({ timestamp }) => timestamp === 1 ? [buy("A"), buy("B")] : [], { initialCash: 10_000, costs: { feeRate: 0, slippageBps: 0, spreadBps: 0 } });
    expect(result.fills.map((f) => f.price)).toEqual([110, 55]);
    expect(result.finalState.positions).toHaveLength(2);
    expect(result.equityCurve).toHaveLength(3);
  });

  it("is deterministic across repeated runs", () => {
    const strategy = ({ timestamp }: { timestamp: number }) => timestamp === 1 ? [buy("A")] : [];
    const input = [series("A", [100, 110, 120])];
    const a = runPortfolioBacktest(input, strategy, { initialCash: 10_000, costs: { feeRate: 0, slippageBps: 0, spreadBps: 0 } });
    const b = runPortfolioBacktest(input, strategy, { initialCash: 10_000, costs: { feeRate: 0, slippageBps: 0, spreadBps: 0 } });
    expect(a).toEqual(b);
  });
});
