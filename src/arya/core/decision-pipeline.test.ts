import { describe, expect, it } from "vitest";
import { InMemoryAuditStore } from "./audit";
import { evaluateDecision } from "./decision-pipeline";
import type { DataEnvelope } from "./data-envelope";
import type { MarketSnapshot, RiskPolicy, TradeProposal } from "./types";

const policy: RiskPolicy = {
  maxRiskPerTradePct: 1,
  maxDailyLossPct: 5,
  maxPortfolioExposurePct: 50,
  requireStopLoss: true,
  maxLeverage: 2,
};

const candle = { t: 1_700_000_000_000, open: 100, high: 102, low: 99, close: 101, volume: 10 };
const market: DataEnvelope<MarketSnapshot> = {
  data: { symbol: "BTCUSDT", timeframe: "1h", candles: [candle], quality: { status: "ok", source: "test", receivedAt: Date.now(), warnings: [] } },
  meta: { source: "test", providerId: "test", status: "LIVE", timestamp: Date.now(), quality: 1 },
};

const proposal: TradeProposal = {
  id: "p-1", symbol: "BTCUSDT", action: "buy", side: "long", confidence: 0.8,
  entry: 100, stopLoss: 95, thesis: "test", rationale: ["test"], model: "test", createdAt: Date.now(),
};

describe("evaluateDecision", () => {
  it("returns a risk decision and appends an audit event", async () => {
    const audit = new InMemoryAuditStore();
    const result = await evaluateDecision({ market, proposal, accountEquity: 10_000, currentExposure: 0, dailyLoss: 0, riskPolicy: policy }, audit);
    expect(result.approved).toBe(true);
    expect(result.positionSize).toBeGreaterThan(0);
    expect(await audit.list("p-1")).toHaveLength(1);
  });

  it("rejects demo/degraded market data even when risk math passes", async () => {
    const degraded = { ...market, meta: { ...market.meta, status: "DEMO" as const, quality: 0.5 } };
    const result = await evaluateDecision({ market: degraded, proposal, accountEquity: 10_000, currentExposure: 0, dailyLoss: 0, riskPolicy: policy });
    expect(result.approved).toBe(false);
    expect(result.reasons).toContain("market data is demo");
  });
});
