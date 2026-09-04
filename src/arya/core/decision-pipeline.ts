import type { DataEnvelope } from "@/arya/core/data-envelope";
import type { AuditStore } from "@/arya/core/audit";
import { evaluateRisk } from "@/arya/core/risk";
import type { MarketSnapshot, RiskPolicy, TradeProposal } from "@/arya/core/types";

export interface DecisionPipelineInput {
  market: DataEnvelope<MarketSnapshot>;
  proposal: TradeProposal;
  accountEquity: number;
  currentExposure: number;
  dailyLoss: number;
  riskPolicy: RiskPolicy;
}

export async function evaluateDecision(input: DecisionPipelineInput, audit?: AuditStore) {
  const decision = evaluateRisk(
    input.proposal,
    input.accountEquity,
    input.currentExposure,
    input.dailyLoss,
    input.riskPolicy,
  );

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
      },
      createdAt: Date.now(),
    });
  }

  return decision;
}
