import { describe, expect, it } from "vitest";
import { envelope, unavailable } from "@/arya/core/data-envelope";
import type { IranDisclosureProvider } from "@/arya/core/iran-market-data";
import type { Candle, Symbol } from "@/arya/core/types";
import type { MarketDataProvider } from "./base";
import { IranMarketCollector } from "./iran-market-collector";

const symbol: Symbol = { id: "tsetmc:1", ticker: "TEST", name: "Test", market: "iran-equity", currency: "IRR" };
const candle: Candle = { t: 1, open: 100, high: 110, low: 90, close: 105, volume: 1_000 };

function marketProvider(): MarketDataProvider {
  return {
    info: { id: "test-market", name: "Test Market", kind: "real", markets: ["iran-equity"], description: "test" },
    health: async () => envelope({ ok: true }, { source: "Test Market", providerId: "test-market", status: "LIVE", quality: 1 }),
    listSymbols: async () => envelope([symbol], { source: "Test Market", providerId: "test-market", status: "LIVE", quality: 1 }),
    getQuote: async () => envelope(null, { source: "Test Market", providerId: "test-market", status: "LIVE", quality: 1 }),
    getOhlcv: async () => envelope([candle], { source: "Test Market", providerId: "test-market", status: "LIVE", quality: 1 }),
  };
}

const failingCodal: IranDisclosureProvider = {
  sourceId: "codal",
  listDisclosures: async () => unavailable([], "Codal", "codal", "network unavailable"),
};

describe("IranMarketCollector", () => {
  it("keeps valid market data LIVE when an optional disclosure stream fails", async () => {
    const collector = new IranMarketCollector({
      marketProvider: marketProvider(),
      disclosureProviders: [failingCodal],
      config: { enabledSources: ["tsetmc-cdn", "codal"], pollIntervalMs: 15_000, requestTimeoutMs: 100, maxRetries: 0 },
    });
    const result = await collector.collect({ symbolId: "tsetmc:1", timeframe: "1D", limit: 10 });
    expect(result.meta.status).toBe("LIVE");
    expect(result.meta.quality).toBe(0);
    expect(result.data.symbols).toHaveLength(1);
    expect(result.data.candles).toHaveLength(1);
    expect(result.data.disclosures).toEqual([]);
    expect(result.meta.reason).toContain("network unavailable");
  });

  it("returns UNAVAILABLE when both symbol catalog and requested history fail", async () => {
    const provider = marketProvider();
    provider.listSymbols = async () => unavailable([], "Test Market", "test-market", "symbols down");
    provider.getOhlcv = async () => unavailable([], "Test Market", "test-market", "history down");
    const collector = new IranMarketCollector({
      marketProvider: provider,
      config: { enabledSources: ["tsetmc-cdn"], pollIntervalMs: 15_000, requestTimeoutMs: 100, maxRetries: 0 },
    });
    const result = await collector.collect("tsetmc:1");
    expect(result.meta.status).toBe("UNAVAILABLE");
    expect(result.data.candles).toEqual([]);
  });
});
