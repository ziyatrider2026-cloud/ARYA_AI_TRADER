import { describe, expect, it } from "vitest";
import { requestAiProposal } from "./ai-gateway";

const market = { symbol: "BTCUSDT", timeframe: "1h", candles: [], quality: { status: "ok" as const, source: "test", receivedAt: Date.now(), warnings: [] } };

describe("AI gateway", () => {
  it("accepts a valid structured proposal", async () => {
    const result = await requestAiProposal({ market, model: "test-model", promptVersion: "v1" }, {
      provider: { id: "test", name: "Test AI", propose: async () => ({
        id: "p1", symbol: "BTCUSDT", action: "buy", side: "long", confidence: 0.9,
        entry: 100, stopLoss: 95, thesis: "trend", rationale: ["momentum"], model: "test-model", createdAt: Date.now(),
      }) },
    });
    expect(result.meta.status).toBe("LIVE");
    expect(result.data?.action).toBe("buy");
  });

  it("rejects malformed model output", async () => {
    const result = await requestAiProposal({ market, model: "test-model", promptVersion: "v1" }, {
      provider: { id: "test", name: "Test AI", propose: async () => ({ action: "buy", confidence: 4 }) },
    });
    expect(result.meta.status).toBe("UNAVAILABLE");
    expect(result.data).toBeNull();
  });
});
