import { z } from "zod";
import type { DataEnvelope } from "./data-envelope";
import { envelope, unavailable } from "./data-envelope";
import type { MarketSnapshot, TradeProposal } from "./types";

export const aiProposalSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  action: z.enum(["buy", "sell", "hold"]),
  side: z.enum(["long", "short"]).optional(),
  confidence: z.number().min(0).max(1),
  entry: z.number().positive().optional(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  thesis: z.string().min(1),
  rationale: z.array(z.string().min(1)).min(1),
  model: z.string().min(1),
  createdAt: z.number().int().positive(),
}).superRefine((value, ctx) => {
  if (value.action !== "hold" && !value.side) ctx.addIssue({ code: "custom", path: ["side"], message: "side is required for executable proposals" });
  if (value.action !== "hold" && value.entry === undefined) ctx.addIssue({ code: "custom", path: ["entry"], message: "entry is required for executable proposals" });
  if (value.action !== "hold" && value.stopLoss === undefined) ctx.addIssue({ code: "custom", path: ["stopLoss"], message: "stopLoss is required for executable proposals" });
});

export type AiProposalOutput = z.infer<typeof aiProposalSchema>;

export interface AiDecisionRequest {
  market: MarketSnapshot;
  model: string;
  promptVersion: string;
}

export interface AiProvider {
  readonly id: string;
  readonly name: string;
  propose(request: AiDecisionRequest): Promise<unknown>;
}

export interface AiGatewayOptions {
  provider: AiProvider;
  minConfidence?: number;
}

export async function requestAiProposal(
  request: AiDecisionRequest,
  options: AiGatewayOptions,
): Promise<DataEnvelope<TradeProposal | null>> {
  try {
    const raw = await options.provider.propose(request);
    const parsed = aiProposalSchema.safeParse(raw);
    if (!parsed.success) {
      return unavailable(null, options.provider.name, options.provider.id, `Invalid AI proposal: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`);
    }
    if (options.minConfidence !== undefined && parsed.data.confidence < options.minConfidence) {
      return envelope(parsed.data, { source: options.provider.name, providerId: options.provider.id, status: "LIVE", quality: 0.5, reason: `AI confidence ${parsed.data.confidence} below gateway threshold ${options.minConfidence}` });
    }
    return envelope(parsed.data, { source: options.provider.name, providerId: options.provider.id, status: "LIVE", quality: 1 });
  } catch (error) {
    return unavailable(null, options.provider.name, options.provider.id, error instanceof Error ? error.message : String(error));
  }
}
