import type { MarketSnapshot, RiskDecision, RiskPolicy, TradeProposal } from "./types";

export function validateProposal(proposal: TradeProposal): string[] {
  const errors: string[] = [];
  if (!proposal.symbol) errors.push("symbol is required");
  if (!Number.isFinite(proposal.confidence) || proposal.confidence < 0 || proposal.confidence > 1) errors.push("confidence must be between 0 and 1");
  if (proposal.action !== "hold" && !proposal.side) errors.push("side is required for buy/sell proposals");
  if (proposal.action !== "hold" && (!Number.isFinite(proposal.entry) || (proposal.entry ?? 0) <= 0)) errors.push("positive entry is required for executable proposals");
  if (proposal.action !== "hold" && (!Number.isFinite(proposal.stopLoss) || (proposal.stopLoss ?? 0) <= 0)) errors.push("positive stopLoss is required for executable proposals");
  if (proposal.action !== "hold" && proposal.side === "long" && (proposal.stopLoss ?? 0) >= (proposal.entry ?? 0)) errors.push("long stopLoss must be below entry");
  if (proposal.action !== "hold" && proposal.side === "short" && (proposal.stopLoss ?? 0) <= (proposal.entry ?? 0)) errors.push("short stopLoss must be above entry");
  return errors;
}

export function evaluateRisk(
  proposal: TradeProposal,
  accountEquity: number,
  currentExposure: number,
  dailyLoss: number,
  policy: RiskPolicy,
): RiskDecision {
  const reasons = validateProposal(proposal);
  if (proposal.action === "hold") reasons.push("proposal is HOLD");
  if (proposal.confidence < 0.55) reasons.push("confidence below minimum 0.55");
  if (policy.requireStopLoss && !proposal.stopLoss) reasons.push("stop loss is required");
  if (!Number.isFinite(accountEquity) || accountEquity <= 0) reasons.push("account equity must be positive");
  if (!Number.isFinite(currentExposure) || currentExposure < 0) reasons.push("current exposure must be non-negative");
  if (!Number.isFinite(dailyLoss) || dailyLoss < 0) reasons.push("daily loss must be non-negative");
  if (dailyLoss >= accountEquity * (policy.maxDailyLossPct / 100)) reasons.push("daily loss limit reached");
  if (currentExposure >= accountEquity * (policy.maxPortfolioExposurePct / 100)) reasons.push("portfolio exposure limit reached");
  if (!Number.isFinite(policy.maxLeverage) || policy.maxLeverage <= 0) reasons.push("max leverage must be positive");

  const riskAmount = Math.max(0, accountEquity * policy.maxRiskPerTradePct / 100);
  const entry = proposal.entry ?? 0;
  const stop = proposal.stopLoss ?? 0;
  const stopDistance = entry > 0 && stop > 0 ? Math.abs(entry - stop) : 0;
  const riskSizedQuantity = stopDistance > 0 ? riskAmount / stopDistance : 0;
  const leverageCapQuantity = entry > 0 && accountEquity > 0 ? (accountEquity * policy.maxLeverage) / entry : 0;
  const positionSize = Math.min(riskSizedQuantity, leverageCapQuantity);
  const approved = reasons.length === 0 && positionSize > 0;
  if (!approved && reasons.length === 0) reasons.push("unable to calculate a safe position size");

  return { approved, reasons: [...new Set(reasons)], riskAmount, positionSize, maxLoss: positionSize * stopDistance };
}

export function assertUsableMarketData(snapshot: MarketSnapshot, now = Date.now()): void {
  if (snapshot.quality.status === "invalid") throw new Error("market data is invalid");
  if (snapshot.candles.length === 0) throw new Error("market data contains no candles");
  const age = now - snapshot.quality.receivedAt;
  if (snapshot.quality.status === "stale" || age > 5 * 60_000) throw new Error("market data is stale");
}
