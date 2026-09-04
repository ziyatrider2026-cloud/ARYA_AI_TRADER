/** ARYA AI TRADER — shared core domain contracts. Pure TypeScript, no I/O. */

export const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W", "1M"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];
export const TIMEFRAME_MS: Record<Timeframe, number> = { "1m": 60_000, "5m": 300_000, "15m": 900_000, "30m": 1_800_000, "1h": 3_600_000, "4h": 14_400_000, "1D": 86_400_000, "1W": 604_800_000, "1M": 2_592_000_000 };
export const MARKETS = ["iran-equity", "crypto", "forex", "commodity", "index"] as const;
export type Market = (typeof MARKETS)[number];
export interface Symbol { id: string; ticker: string; name: string; market: Market; currency: string; }
export interface Candle { t: number; open: number; high: number; low: number; close: number; volume: number; }
export interface Series { symbolId: string; timeframe: Timeframe; candles: Candle[]; }
export type Direction = "bullish" | "bearish" | "neutral";
export const ACTIONS = ["STRONG_BUY", "BUY", "WATCH", "NEUTRAL", "SELL", "STRONG_SELL"] as const;
export type Action = (typeof ACTIONS)[number];
export type ExecutionMode = "backtest" | "paper" | "live";
export type Side = "long" | "short";
export type SignalAction = "buy" | "sell" | "hold";
export interface DataQuality { status: "ok" | "stale" | "partial" | "invalid"; source: string; sourceTime?: number; receivedAt: number; coverage?: number; warnings: string[]; }
export interface MarketSnapshot { symbol: string; timeframe: string; candles: Candle[]; quality: DataQuality; }
export interface TradeProposal { id: string; symbol: string; action: SignalAction; side?: Side; confidence: number; entry?: number; stopLoss?: number; takeProfit?: number; thesis: string; rationale: string[]; model: string; createdAt: number; }
export interface RiskPolicy { maxRiskPerTradePct: number; maxDailyLossPct: number; maxPortfolioExposurePct: number; requireStopLoss: boolean; maxLeverage: number; }
export interface RiskDecision { approved: boolean; reasons: string[]; riskAmount: number; positionSize: number; maxLoss: number; }
export interface OrderIntent { id: string; symbol: string; side: Side; quantity: number; entry?: number; stopLoss?: number; takeProfit?: number; mode: ExecutionMode; proposalId: string; createdAt: number; }
export interface ExecutionResult { orderId: string; status: "accepted" | "rejected" | "filled" | "partially_filled" | "cancelled"; filledQuantity: number; averagePrice?: number; message?: string; executedAt: number; }
export interface AuditEvent { id: string; type: "market" | "analysis" | "ai_proposal" | "risk" | "order" | "execution" | "system"; actor: "system" | "ai" | "operator"; correlationId?: string; payload: Record<string, unknown>; createdAt: number; }
