/** Unified, auditable analysis result consumed by UI and downstream decision layers. */
import type { DataEnvelope } from "./data-envelope";
import type { Action, Candle, Direction } from "./types";

export interface AnalysisSection<T = Record<string, unknown>> {
  value: T;
  score: number;
  confidence: number;
  coverage: number;
  reasons: string[];
}

export interface MarketAnalysisData {
  candles: Candle[];
  latestPrice?: number;
  changePct?: number;
}

export interface AnalysisDecision {
  action: Action;
  direction: Direction;
  confidence: number;
  allowed: boolean;
  reasons: string[];
}

export interface AnalysisSnapshot {
  id: string;
  version: 1;
  symbolId: string;
  timeframe: string;
  createdAt: number;
  marketData: DataEnvelope<MarketAnalysisData>;
  technical: AnalysisSection;
  smartMoney: AnalysisSection;
  fundamental: AnalysisSection | null;
  news: AnalysisSection | null;
  risk: AnalysisSection;
  decision: AnalysisDecision;
  provenance: {
    generatedAt: number;
    inputTimestamps: number[];
    sources: string[];
  };
}

export function clampScore(value: number): number {
  return Math.max(-100, Math.min(100, Number.isFinite(value) ? value : 0));
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
