import type { AuditEvent, Candle, TradeProposal } from "./types";
import type {
  AnalysisSnapshotRecord,
  MarketCandleRecord,
  PersistenceRepository,
  ProposalRecord,
} from "./persistence";

export interface SupabasePersistenceOptions {
  url: string;
  serviceRoleKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

type Row = Record<string, unknown>;

/**
 * Server-only persistence adapter for Supabase PostgREST.
 * Never expose the service-role key to browser/client code.
 */
export class SupabasePersistenceRepository implements PersistenceRepository {
  private readonly baseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: SupabasePersistenceOptions) {
    if (!options.url.trim()) throw new Error("Supabase URL is required");
    if (!options.serviceRoleKey.trim()) throw new Error("Supabase service role key is required");
    this.baseUrl = options.url.replace(/\/$/, "");
    this.serviceRoleKey = options.serviceRoleKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) throw new Error("timeoutMs must be positive");
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers = new Headers(init.headers);
      headers.set("Accept", "application/json");
      headers.set("apikey", this.serviceRoleKey);
      headers.set("Authorization", `Bearer ${this.serviceRoleKey}`);
      if (init.body !== undefined) headers.set("Content-Type", "application/json");
      const response = await this.fetchImpl(`${this.baseUrl}/rest/v1${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Supabase HTTP ${response.status}: ${await response.text()}`);
      if (response.status === 204) return undefined as T;
      return await response.json() as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async saveCandles(records: MarketCandleRecord[]): Promise<void> {
    if (!records.length) return;
    await this.request("/market_candles?on_conflict=symbol_id%2Ctimeframe%2Ccandle_t", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(records.map((record) => ({
        symbol_id: record.symbolId,
        timeframe: record.timeframe,
        candle_t: record.candle.t,
        open: record.candle.open,
        high: record.candle.high,
        low: record.candle.low,
        close: record.candle.close,
        volume: record.candle.volume,
        provider_id: record.providerId,
        received_at: record.receivedAt,
      }))),
    });
  }

  async getCandles(symbolId: string, timeframe: string, limit = 500): Promise<MarketCandleRecord[]> {
    if (!Number.isInteger(limit) || limit <= 0) throw new Error("limit must be a positive integer");
    const rows = await this.request<Row[]>(`/market_candles?select=*&symbol_id=eq.${encodeURIComponent(symbolId)}&timeframe=eq.${encodeURIComponent(timeframe)}&order=candle_t.desc&limit=${limit}`);
    return rows.reverse().map((row) => ({
      symbolId: String(row.symbol_id), timeframe: String(row.timeframe),
      candle: { t: Number(row.candle_t), open: Number(row.open), high: Number(row.high), low: Number(row.low), close: Number(row.close), volume: Number(row.volume) },
      providerId: String(row.provider_id), receivedAt: Number(row.received_at),
    }));
  }

  async saveAnalysis(snapshot: AnalysisSnapshotRecord): Promise<void> {
    await this.request("/analysis_snapshots", {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ id: snapshot.id, symbol_id: snapshot.symbolId, timeframe: snapshot.timeframe, created_at: snapshot.createdAt, payload: snapshot.payload }),
    });
  }

  async saveProposal(proposal: ProposalRecord): Promise<void> {
    await this.request("/proposals", {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ ...proposal, symbol: proposal.symbol, persisted_at: proposal.persistedAt }),
    });
  }

  async listProposals(symbolId?: string): Promise<ProposalRecord[]> {
    const suffix = symbolId ? `&symbol=eq.${encodeURIComponent(symbolId)}` : "";
    const rows = await this.request<Row[]>(`/proposals?select=*&order=persisted_at.desc${suffix}`);
    return rows.map((row) => row as unknown as ProposalRecord);
  }

  async appendAudit(event: AuditEvent): Promise<void> {
    await this.request("/audit_events", {
      method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ id: event.id, type: event.type, actor: event.actor, correlation_id: event.correlationId, payload: event.payload, created_at: event.createdAt }),
    });
  }

  async listAudit(correlationId?: string): Promise<AuditEvent[]> {
    const suffix = correlationId ? `&correlation_id=eq.${encodeURIComponent(correlationId)}` : "";
    const rows = await this.request<Row[]>(`/audit_events?select=*&order=created_at.desc${suffix}`);
    return rows.map((row) => ({ id: String(row.id), type: row.type as AuditEvent["type"], actor: String(row.actor), correlationId: String(row.correlation_id), payload: (row.payload ?? {}) as Record<string, unknown>, createdAt: Number(row.created_at) }));
  }
}

export function candleRecord(symbolId: string, timeframe: string, candle: Candle, providerId: string, receivedAt = Date.now()): MarketCandleRecord {
  return { symbolId, timeframe, candle, providerId, receivedAt };
}

export function proposalRecord(proposal: TradeProposal, persistedAt = Date.now()): ProposalRecord {
  return { ...proposal, persistedAt };
}
