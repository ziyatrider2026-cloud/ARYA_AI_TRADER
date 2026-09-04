import type { DataEnvelope } from "./data-envelope";
import type { Candle, Timeframe } from "./types";
import type { MarketDataProvider } from "./market-data";

/** Application service over the canonical provider boundary. */
export function createMarketDataService(provider: MarketDataProvider) {
  return {
    async candles(symbolId: string, timeframe: Timeframe, limit = 500): Promise<DataEnvelope<Candle[]>> {
      return provider.getOhlcv({ symbolId, timeframe, limit });
    },

    async quote(symbolId: string) {
      return provider.getQuote(symbolId);
    },

    async health() {
      return provider.health();
    },
  };
}
