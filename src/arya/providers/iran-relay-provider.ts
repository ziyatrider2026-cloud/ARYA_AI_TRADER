import { envelope, unavailable, type DataEnvelope } from "@/arya/core/data-envelope";
import type { Candle, Market, Symbol, Timeframe } from "@/arya/core/types";
import type { MarketDataProvider, OhlcvRequest, ProviderInfo, QuoteSnapshot } from "./base";

/**
 * Server/edge adapter for a relay deployed inside Iran.
 * The relay owns access to TSE Web Gateway/Codal and returns the canonical
 * ARYA provider shapes. No credentials or live-order capability are present.
 */
export interface IranRelayProviderOptions { baseUrl: string; fetchImpl?: typeof fetch; timeoutMs?: number; }
const INFO: ProviderInfo = { id: "iran-relay", name: "ARYA Iran Market Relay", kind: "real", markets: ["iran-equity", "index"], description: "Read-only relay for Iranian market sources; deployment location is operator-controlled." };

export class IranRelayProvider implements MarketDataProvider {
  readonly info = INFO;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  constructor(options: IranRelayProviderOptions) { this.baseUrl = options.baseUrl.replace(/\/$/, ""); this.fetchImpl = options.fetchImpl ?? fetch; this.timeoutMs = options.timeoutMs ?? 8_000; }
  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try { const r = await this.fetchImpl(`${this.baseUrl}${path}`, { headers: { Accept: "application/json" }, signal: controller.signal }); if (!r.ok) throw new Error(`Iran relay HTTP ${r.status}`); return await r.json() as T; }
    finally { clearTimeout(timer); }
  }
  async health(): Promise<DataEnvelope<{ ok: boolean }>> { try { return envelope(await this.get<{ ok: boolean }>("/health"), { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: 1 }); } catch (e) { return unavailable({ ok: false }, this.info.name, this.info.id, e instanceof Error ? e.message : String(e)); } }
  async listSymbols(market?: Market): Promise<DataEnvelope<Symbol[]>> { if (market && !this.info.markets.includes(market)) return envelope([], { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: 1, reason: `unsupported market ${market}` }); try { return envelope(await this.get<Symbol[]>("/v1/market/symbols"), { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: 1 }); } catch (e) { return unavailable([], this.info.name, this.info.id, e instanceof Error ? e.message : String(e)); } }
  async getQuote(symbolId: string): Promise<DataEnvelope<QuoteSnapshot | null>> { try { return envelope(await this.get<QuoteSnapshot>(`/v1/market/quote/${encodeURIComponent(symbolId)}`), { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: 1 }); } catch (e) { return unavailable(null, this.info.name, this.info.id, e instanceof Error ? e.message : String(e)); } }
  async getOhlcv(request: OhlcvRequest): Promise<DataEnvelope<Candle[]>> { try { return envelope((await this.get<{ candles: Candle[] }>(`/v1/market/ohlcv/${encodeURIComponent(request.symbolId)}?timeframe=${encodeURIComponent(request.timeframe)}&limit=${request.limit}`)).candles, { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: 1 }); } catch (e) { return unavailable([], this.info.name, this.info.id, e instanceof Error ? e.message : String(e)); } }
}
