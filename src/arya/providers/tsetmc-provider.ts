import { envelope, unavailable, withFreshness, type DataEnvelope } from "@/arya/core/data-envelope";
import { normalizeCandle, validateCandles } from "@/arya/core/data-quality";
import type { Candle, Market, Symbol, Timeframe } from "@/arya/core/types";
import type { MarketDataProvider, OhlcvRequest, ProviderInfo, QuoteSnapshot } from "./base";

export interface TsetmcProviderOptions { baseUrl?: string; fetchImpl?: typeof fetch; timeoutMs?: number; }

const INFO: ProviderInfo = {
  id: "tsetmc-public",
  name: "TSETMC Public Market Data",
  kind: "real",
  markets: ["iran-equity", "index"],
  description: "Read-only adapter for publicly exposed TSETMC market data; endpoint stability and network geography must be monitored.",
};

const intervalDays: Record<Timeframe, number> = { "1m": 1, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240, "1D": 1, "1W": 7, "1M": 30 };

function unwrap<T>(value: unknown, key: string): T {
  if (!value || typeof value !== "object") return value as T;
  const obj = value as Record<string, unknown>;
  return (obj[key] ?? value) as T;
}

export class TsetmcProvider implements MarketDataProvider {
  readonly info = INFO;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: TsetmcProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://cdn.tsetmc.com").replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 ARYA_AI_TRADER" }, signal: controller.signal });
      if (!response.ok) throw new Error(`TSETMC HTTP ${response.status}`);
      const text = await response.text();
      if (/مسدود|دسترسی شما|General Error Detected/i.test(text)) throw new Error("TSETMC access blocked or degraded");
      return JSON.parse(text) as T;
    } finally { clearTimeout(timer); }
  }

  async health(): Promise<DataEnvelope<{ ok: boolean }>> {
    try { await this.get("/api/MarketData/GetMarketOverview/0"); return envelope({ ok: true }, { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: 1 }); }
    catch (error) { return unavailable({ ok: false }, this.info.name, this.info.id, error instanceof Error ? error.message : String(error)); }
  }

  async listSymbols(market?: Market): Promise<DataEnvelope<Symbol[]>> {
    if (market && !this.info.markets.includes(market)) return envelope([], { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: 1, reason: `unsupported market ${market}` });
    try {
      const raw = unwrap<Array<Record<string, unknown>>>(await this.get("/api/Instrument/GetInstrumentSearch/%20"), "instrumentSearch");
      const symbols = (Array.isArray(raw) ? raw : []).filter((x) => x.insCode).map((x) => ({ id: `tsetmc:${String(x.insCode)}`, ticker: String(x.lVal18AFC ?? ""), name: String(x.lVal30 ?? x.lVal18AFC ?? ""), market: "iran-equity" as const, currency: "IRR" }));
      return envelope(symbols, { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: symbols.length ? 1 : 0.4 });
    } catch (error) { return unavailable([], this.info.name, this.info.id, error instanceof Error ? error.message : String(error)); }
  }

  async getQuote(symbolId: string): Promise<DataEnvelope<QuoteSnapshot | null>> {
    const code = symbolId.replace(/^tsetmc:/, "");
    try {
      const raw = unwrap<Record<string, unknown>>(await this.get(`/api/ClosingPrice/GetClosingPriceInfo/${encodeURIComponent(code)}`), "closingPriceInfo");
      const price = Number(raw.pDrCotVal ?? raw.pl ?? raw.pClosing ?? 0);
      const yesterday = Number(raw.priceYesterday ?? raw.py ?? price);
      const volume = Number(raw.qTotTran5J ?? raw.qTotTran ?? 0);
      if (!Number.isFinite(price) || price <= 0) throw new Error("TSETMC quote missing valid price");
      const env = envelope({ symbolId, price, changePct: yesterday ? ((price - yesterday) / yesterday) * 100 : 0, volume, updatedAt: Date.now() }, { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: 1 });
      return withFreshness(env, 120_000);
    } catch (error) { return unavailable(null, this.info.name, this.info.id, error instanceof Error ? error.message : String(error)); }
  }

  async getOhlcv(request: OhlcvRequest): Promise<DataEnvelope<Candle[]>> {
    const code = request.symbolId.replace(/^tsetmc:/, "");
    try {
      const raw = unwrap<Array<Record<string, unknown>>>(await this.get(`/api/ClosingPrice/GetClosingPriceDailyList/${encodeURIComponent(code)}/${Math.max(request.limit, intervalDays[request.timeframe])}`), "closingPriceDaily");
      const candles = (Array.isArray(raw) ? raw : []).map((x) => normalizeCandle({ t: Number(x.dEven ?? x.t), open: Number(x.pFirst ?? x.pf ?? x.open), high: Number(x.pMax ?? x.priceMax ?? x.high), low: Number(x.pMin ?? x.priceMin ?? x.low), close: Number(x.pClosing ?? x.pc ?? x.close), volume: Number(x.qTotTran5J ?? x.volume ?? 0) })).filter((x): x is Candle => x !== null);
      const quality = validateCandles(candles, request.timeframe, request.limit);
      if (!candles.length || quality.status === "invalid") return unavailable([], this.info.name, this.info.id, "TSETMC returned no valid candles");
      return envelope(quality.candles.slice(-request.limit), { source: this.info.name, providerId: this.info.id, status: "LIVE", quality: quality.coverage, reason: quality.warnings.join("; ") || undefined });
    } catch (error) { return unavailable([], this.info.name, this.info.id, error instanceof Error ? error.message : String(error)); }
  }
}
