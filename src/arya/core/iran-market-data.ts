/** Iran market-data ingestion contracts. No network calls live in this module. */
import type { DataEnvelope } from "./data-envelope";
import type { Candle, Symbol, Timeframe } from "./types";

export type IranSourceId = "tsetmc-cdn" | "tse-webgw" | "codal" | "observer" | "macro";

export interface IranMarketSource {
  readonly id: IranSourceId;
  readonly name: string;
  readonly role: "prices" | "orderbook" | "fundamentals" | "disclosures" | "macro";
  readonly networkRequirement: "public" | "iran-ip-preferred" | "iran-ip-required";
}

export interface IranCollectorConfig {
  enabledSources: IranSourceId[];
  pollIntervalMs: number;
  requestTimeoutMs: number;
  maxRetries: number;
  iranRelayBaseUrl?: string;
}

export interface IranDisclosure {
  id: string;
  symbol?: string;
  title: string;
  publishedAt: number;
  url?: string;
  sourceId: "codal" | "observer";
}

export interface IranSnapshot {
  symbols: Symbol[];
  candles: Candle[];
  disclosures: IranDisclosure[];
}

export interface IranCollectRequest {
  symbolId?: string;
  timeframe?: Timeframe;
  limit?: number;
}

export interface IranCollector {
  collect(request?: IranCollectRequest | string): Promise<DataEnvelope<IranSnapshot>>;
}

export interface IranDisclosureProvider {
  readonly sourceId: "codal" | "observer";
  listDisclosures(symbolId?: string, limit?: number): Promise<DataEnvelope<IranDisclosure[]>>;
}

export const IRAN_SOURCE_CATALOG: readonly IranMarketSource[] = [
  { id: "tsetmc-cdn", name: "TSETMC CDN", role: "prices", networkRequirement: "public" },
  { id: "tse-webgw", name: "TSE Web Gateway", role: "orderbook", networkRequirement: "iran-ip-required" },
  { id: "codal", name: "Codal", role: "disclosures", networkRequirement: "iran-ip-preferred" },
  { id: "observer", name: "Market Observer / پیام ناظر", role: "orderbook", networkRequirement: "iran-ip-preferred" },
  { id: "macro", name: "Iran macro/reference sources", role: "macro", networkRequirement: "public" },
] as const;

export const DEFAULT_IRAN_COLLECTOR_CONFIG: IranCollectorConfig = {
  enabledSources: ["tsetmc-cdn", "codal", "observer"],
  pollIntervalMs: 15_000,
  requestTimeoutMs: 8_000,
  maxRetries: 2,
};
