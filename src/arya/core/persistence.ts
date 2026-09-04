import type { AuditEvent, Candle, TradeProposal } from "./types";

export interface MarketCandleRecord {
  symbolId: string;
  timeframe: string;
  candle: Candle;
  providerId: string;
  receivedAt: number;
}

export interface AnalysisSnapshotRecord {
  id: string;
  symbolId: string;
  timeframe: string;
  createdAt: number;
  payload: Record<string, unknown>;
}

export interface ProposalRecord extends TradeProposal {
  persistedAt: number;
}

export interface PersistenceRepository {
  saveCandles(records: MarketCandleRecord[]): Promise<void>;
  getCandles(symbolId: string, timeframe: string, limit?: number): Promise<MarketCandleRecord[]>;
  saveAnalysis(snapshot: AnalysisSnapshotRecord): Promise<void>;
  saveProposal(proposal: ProposalRecord): Promise<void>;
  listProposals(symbolId?: string): Promise<ProposalRecord[]>;
  appendAudit(event: AuditEvent): Promise<void>;
  listAudit(correlationId?: string): Promise<AuditEvent[]>;
}

/** Deterministic in-memory repository for tests and local development. */
export class InMemoryPersistenceRepository implements PersistenceRepository {
  private readonly candles: MarketCandleRecord[] = [];
  private readonly analyses: AnalysisSnapshotRecord[] = [];
  private readonly proposals: ProposalRecord[] = [];
  private readonly audit: AuditEvent[] = [];

  async saveCandles(records: MarketCandleRecord[]): Promise<void> {
    for (const record of records) {
      const index = this.candles.findIndex(
        (item) => item.symbolId === record.symbolId && item.timeframe === record.timeframe && item.candle.t === record.candle.t,
      );
      if (index >= 0) this.candles[index] = { ...record, candle: { ...record.candle } };
      else this.candles.push({ ...record, candle: { ...record.candle } });
    }
  }

  async getCandles(symbolId: string, timeframe: string, limit = 500): Promise<MarketCandleRecord[]> {
    return this.candles
      .filter((item) => item.symbolId === symbolId && item.timeframe === timeframe)
      .sort((a, b) => b.candle.t - a.candle.t)
      .slice(0, limit)
      .reverse()
      .map((item) => ({ ...item, candle: { ...item.candle } }));
  }

  async saveAnalysis(snapshot: AnalysisSnapshotRecord): Promise<void> {
    this.analyses.push({ ...snapshot, payload: { ...snapshot.payload } });
  }

  async saveProposal(proposal: ProposalRecord): Promise<void> {
    this.proposals.push({ ...proposal, rationale: [...proposal.rationale] });
  }

  async listProposals(symbolId?: string): Promise<ProposalRecord[]> {
    return this.proposals
      .filter((proposal) => !symbolId || proposal.symbol === symbolId)
      .map((proposal) => ({ ...proposal, rationale: [...proposal.rationale] }));
  }

  async appendAudit(event: AuditEvent): Promise<void> {
    this.audit.push({ ...event, payload: { ...event.payload } });
  }

  async listAudit(correlationId?: string): Promise<AuditEvent[]> {
    return this.audit
      .filter((event) => !correlationId || event.correlationId === correlationId)
      .map((event) => ({ ...event, payload: { ...event.payload } }));
  }
}
