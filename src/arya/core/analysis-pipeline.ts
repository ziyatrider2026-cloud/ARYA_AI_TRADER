import { combineMeta, envelope, unavailable, type DataEnvelope } from "./data-envelope";
import type { AnalysisSnapshot, AnalysisSection } from "./analysis-snapshot";
import type { Candle, Timeframe } from "./types";

export interface AnalysisInput {
  symbolId: string;
  timeframe: Timeframe;
  marketData: DataEnvelope<Candle[]>;
  technical?: AnalysisSection;
  smartMoney?: AnalysisSection;
  fundamental?: AnalysisSection | null;
  news?: AnalysisSection | null;
  risk?: AnalysisSection;
}

const emptySection = (reason: string): AnalysisSection => ({
  value: {}, score: 0, confidence: 0, coverage: 0, reasons: [reason],
});

export function buildAnalysisSnapshot(input: AnalysisInput, now = Date.now()): AnalysisSnapshot {
  const technical = input.technical ?? emptySection("Technical analysis is not available");
  const smartMoney = input.smartMoney ?? emptySection("Smart Money analysis is not available");
  const fundamental = input.fundamental === undefined ? null : input.fundamental;
  const news = input.news === undefined ? null : input.news;
  const risk = input.risk ?? emptySection("Risk analysis is not available");
  const allowedData = input.marketData.meta.status === "LIVE" || input.marketData.meta.status === "STALE";
  const combined = combineMeta([input.marketData.meta], "ARYA Analysis Pipeline", "analysis-pipeline");
  const directionalScore = (technical.score * 0.5) + (smartMoney.score * 0.5);
  const confidence = Math.min(technical.confidence, smartMoney.confidence, input.marketData.meta.quality);
  const action = !allowedData || confidence < 0.55 ? "NEUTRAL" : directionalScore >= 60 ? "STRONG_BUY" : directionalScore >= 20 ? "BUY" : directionalScore <= -60 ? "STRONG_SELL" : directionalScore <= -20 ? "SELL" : "WATCH";
  const direction = directionalScore > 10 ? "bullish" : directionalScore < -10 ? "bearish" : "neutral";
  const reasons = !allowedData ? ["Market data is not usable for a directional decision"] : [...technical.reasons, ...smartMoney.reasons];
  return {
    id: `${input.symbolId}:${input.timeframe}:${now}`,
    version: 1,
    symbolId: input.symbolId,
    timeframe: input.timeframe,
    createdAt: now,
    marketData: envelope({ candles: input.marketData.data, latestPrice: input.marketData.data.at(-1)?.close }, { ...combined, timestamp: input.marketData.meta.timestamp }),
    technical, smartMoney, fundamental, news, risk,
    decision: { action, direction, confidence, allowed: allowedData && confidence >= 0.55, reasons },
    provenance: { generatedAt: now, inputTimestamps: [input.marketData.meta.timestamp], sources: [input.marketData.meta.source] },
  };
}

export function unavailableAnalysis(symbolId: string, timeframe: Timeframe, reason: string, now = Date.now()): AnalysisSnapshot {
  const marketData = unavailable<Candle[]>([], "ARYA Analysis Pipeline", "analysis-pipeline", reason);
  return buildAnalysisSnapshot({ symbolId, timeframe, marketData }, now);
}
