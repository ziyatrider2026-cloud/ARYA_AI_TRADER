import { envelope, unavailable, type DataEnvelope } from "@/arya/core/data-envelope";
import { normalizeCandle, validateCandles } from "@/arya/core/data-quality";
import type { Candle, Market, Symbol, Timeframe } from "@/arya/core/types";
import type { MarketDataProvider, OhlcvRequest, ProviderInfo, QuoteSnapshot } from "./base";

const INFO: ProviderInfo = {
  id: "binance-public",
  name: "Binance Public Market Data",
  kind: "real",
  markets: ["crypto"],
  description: "Public crypto market-data adapter; no trading credentials are used.",
};

const DEFAULT_BASE_URL = "https://api.binance.com";

const INTERVALS: Record<Timeframe, string | undefined> = {
  "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m", "1h": "1h", "4h": "4h", "1D": "1d", "1W": "1w", "1M": "1M",
};

export interface BinanceProviderOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

function symbolOf(symbolId: string): string {
  return symbolId.includes(":") ? symbolId.split(":")[1]! : symbolId;
}

export class BinanceProvider implements MarketDataProvider {
  readonly info = INFO;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: BinanceProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  private async request<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Binance HTTP ${response.status}`);
      return (await response.json()) as T;
    } finally { clearTimeout(timer); }
  }

  async health(): Promise<DataEnvelope<{ ok: boolean }>> {
    try { await this.request("/api/v3/ping"); return envelope({ ok: true }, { source: INFO.name, providerId: INFO.id, status: "LIVE", quality: 1 }); }
    catch (error) { return unavailable({ ok: false }, INFO.name, INFO.id, error instanceof Error ? error.message : String(error)); }
  }

  async listSymbols(market?: Market): Promise<DataEnvelope<Symbol[]>> {
    if (market && market !== "crypto") return envelope([], { source: INFO.name, providerId: INFO.id, status: "LIVE", quality: 1 });
    try {
      const data = await this.request<{ symbols?: Array<{ symbol: string; status: string; baseAsset: string; quoteAsset: string }> }>("/api/v3/exchangeInfo");
      const symbols = (data.symbols ?? []).filter((s) => s.status === "TRADING").map((s) => ({ id: `crypto:${s.symbol}`, ticker: s.symbol, name: `${s.baseAsset} / ${s.quoteAsset}`, market: "crypto" as const, currency: s.quoteAsset }));
      return envelope(symbols, { source: INFO.name, providerId: INFO.id, status: "LIVE", quality: symbols.length ? 1 : 0 });
    } catch (error) { return unavailable([], INFO.name, INFO.id, error instanceof Error ? error.message : String(error)); }
  }

  async getQuote(symbolId: string): Promise<DataEnvelope<QuoteSnapshot | null>> {
    try {
      const ticker = await this.request<{ price: string }>(`/api/v3/ticker/price?symbol=${encodeURIComponent(symbolOf(symbolId))}`);
      const stats = await this.request<{ priceChangePercent: string; volume: string; closeTime: number }>(`/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbolOf(symbolId))}`);
      return envelope({ symbolId, price: Number(ticker.price), changePct: Number(stats.priceChangePercent), volume: Number(stats.volume), updatedAt: stats.closeTime }, { source: INFO.name, providerId: INFO.id, status: "LIVE", quality: 1 });
    } catch (error) { return unavailable(null, INFO.name, INFO.id, error instanceof Error ? error.message : String(error)); }
  }

  async getOhlcv(request: OhlcvRequest): Promise<DataEnvelope<Candle[]>> {
    const interval = INTERVALS[request.timeframe];
    if (!interval) return unavailable([], INFO.name, INFO.id, `Unsupported timeframe: ${request.timeframe}`);
    const limit = Math.max(1, Math.min(request.limit, 1000));
    try {
      const raw = await this.request<unknown[][]>(`/api/v3/klines?symbol=${encodeURIComponent(symbolOf(request.symbolId))}&interval=${interval}&limit=${limit}`);
      const normalized = raw.map((row) => normalizeCandle({ t: row[0], open: row[1], high: row[2], low: row[3], close: row[4], volume: row[5] })).filter((c): c is Candle => c !== null);
      const quality = validateCandles(normalized, request.timeframe, limit);
      return envelope(quality.candles, { source: INFO.name, providerId: INFO.id, status: quality.status === "ok" ? "LIVE" : "LIVE", quality: quality.coverage, reason: quality.warnings.length ? quality.warnings.join("; ") : undefined });
    } catch (error) { return unavailable([], INFO.name, INFO.id, error instanceof Error ? error.message : String(error)); }
  }
}
