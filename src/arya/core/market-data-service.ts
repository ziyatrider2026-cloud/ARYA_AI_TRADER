import type { MarketSnapshot } from "./types";
import type { MarketDataProvider } from "./market-data";

export function createMarketDataService(provider: MarketDataProvider) {
  return {
    async snapshot(symbol: string, timeframe: string, limit = 500): Promise<MarketSnapshot> {
      const result = await provider.getSnapshot(symbol, timeframe, limit);
      if (!result || result.candles.length === 0) {
        throw new Error(`No market data returned for ${symbol} ${timeframe}`);
      }
      return result;
    },
  };
}
