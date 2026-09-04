/**
 * Compatibility exports for the canonical provider contract.
 *
 * Provider implementations live under `src/arya/providers`; this module must
 * not define a second, incompatible market-data interface.
 */
export type { MarketDataProvider } from "@/arya/providers/base";
export type { ProviderInfo, OhlcvRequest, QuoteSnapshot } from "@/arya/providers/base";
