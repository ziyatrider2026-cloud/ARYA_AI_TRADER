export type ExecutionMode = "backtest" | "paper" | "live";
export type Side = "long" | "short";
export type SignalAction = "buy" | "sell" | "hold";

export interface Candle {
  symbol: string;
  timeframe: string;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DataQuality {
  status: "ok" | "stale" | "partial" | "invalid";
  source: string;
  sourceTime?: number;
  receivedAt: number;
  coverage?: number;
  warnings: string[];
}

export interface MarketSnapshot {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  quality: DataQuality;
}

export interface TradeProposal {
  id: string;
  symbol: string;
  action: SignalAction;
  side?: Side;
  confidence: number;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  thesis: string;
  rationale: string[];
  model: string;
  createdAt: number;
}

export interface RiskPolicy {
  maxRiskPerTradePct: number;
  maxDailyLossPct: number;
  maxPortfolioExposurePct: number;
  requireStopLoss: boolean;
  maxLeverage: number;
}

export interface RiskDecision {
  approved: boolean;
  reasons: string[];
  riskAmount: number;
  positionSize: number;
  maxLoss: number;
}

export interface OrderIntent {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  mode: ExecutionMode;
  proposalId: string;
  createdAt: number;
}

export interface ExecutionResult {
  orderId: string;
  status: "accepted" | "rejected" | "filled" | "partially_filled" | "cancelled";
  filledQuantity: number;
  averagePrice?: number;
  message?: string;
  executedAt: number;
}

export interface AuditEvent {
  id: string;
  type: "market" | "analysis" | "ai_proposal" | "risk" | "order" | "execution" | "system";
  actor: "system" | "ai" | "operator";
  correlationId?: string;
  payload: Record<string, unknown>;
  createdAt: number;
}
