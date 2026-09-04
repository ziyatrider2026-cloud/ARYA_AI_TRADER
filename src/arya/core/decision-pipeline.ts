import type { DataEnvelope } from "@/arya/core/data-envelope";
import type { AuditStore } from "@/arya/core/audit";
import { evaluateRisk } from "@/arya/core/risk";
import type { MarketSnapshot, RiskDecision, RiskPolicy, TradeProposal } from "@/arya/core/types";

export interface DecisionPipelineInput {
  market: DataEnvelope<MarketSnapshot>;
  proposal: TradeProposal;
  accountEquity: number;
  currentExposure: number;
  dailyLoss: number;
  riskPolicy: RiskPolicy;
}

export async function evaluateDecision(input: DecisionPipelineInput, audit?: AuditStore): Promise<RiskDecision> {
  const risk = evaluateRisk(input.proposal, input.accountEquity, input.currentExposure, input.dailyLoss, input.riskPolicy);
  const dataReasons: string[] = [];

  if (input.market.meta.status !== "LIVE") dataReasons.push(`market data is ${input.market.meta.status.toLowerCase()}`);
  if (input.market.meta.quality < 0.8) dataReasons.push(`market data quality below 0.8 (${input.market.meta.quality.toFixed(2)})`);
  if (input.market.data.candles.length === 0) dataReasons.push("market data contains no candles");

  const reasons = [...new Set([...risk.reasons, ...dataReasons])];
  const decision: RiskDecision = {
    ...risk,
    approved: risk.approved && dataReasons.length === 0,
    reasons,
  };

  if (audit) {
    await audit.append({
      id: `risk-${input.proposal.id}-${Date.now()}`,
      type: "risk",
      actor: "system",
      correlationId: input.proposal.id,
      payload: {
        approved: decision.approved,
        reasons: decision.reasons,
        providerId: input.market.meta.providerId,
        dataStatus: input.market.meta.status,
        dataQuality: input.market.meta.quality,
      },
      createdAt: Date.now(),
    });
  }

  return decision;
}
