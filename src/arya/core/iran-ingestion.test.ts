import { describe, expect, it } from "vitest";
import { envelope } from "./data-envelope";
import { collectAndPersistIranMarket } from "./iran-ingestion";
import type { IranCollector } from "./iran-market-data";
import { InMemoryPersistenceRepository } from "./persistence";

const collector: IranCollector = {
  collect: async () => envelope({
    symbols: [],
    candles: [{ t: 1, open: 100, high: 110, low: 90, close: 105, volume: 1_000 }],
    disclosures: [],
  }, { source: "test", providerId: "test", status: "LIVE", quality: 1, timestamp: 123 }),
};

describe("collectAndPersistIranMarket", () => {
  it("persists candles with the collector provenance", async () => {
    const repository = new InMemoryPersistenceRepository();
    const result = await collectAndPersistIranMarket(collector, repository, { symbolId: "tsetmc:1", timeframe: "1D" });
    expect(result.persistedCandles).toBe(1);
    await expect(repository.getCandles("tsetmc:1", "1D")).resolves.toEqual([
      {
        symbolId: "tsetmc:1",
        timeframe: "1D",
        candle: { t: 1, open: 100, high: 110, low: 90, close: 105, volume: 1_000 },
        providerId: "test",
        receivedAt: 123,
      },
    ]);
  });
});
