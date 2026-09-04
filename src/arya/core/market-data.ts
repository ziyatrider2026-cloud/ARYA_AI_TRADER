import type { MarketSnapshot } from "./types";

export interface MarketDataProvider {
  readonly name: string;
  getSnapshot(symbol: string, timeframe: string, limit?: number): Promise<MarketSnapshot>;
}

export interface MarketDataRegistry {
  register(provider: MarketDataProvider): void;
  get(name: string): MarketDataProvider | undefined;
}
