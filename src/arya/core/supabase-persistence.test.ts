import { describe, expect, it } from "vitest";
import type { TradeProposal } from "./types";
import { SupabasePersistenceRepository, proposalRecord } from "./supabase-persistence";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("SupabasePersistenceRepository", () => {
  it("writes canonical candle columns through PostgREST", async () => {
    let request: Request | undefined;
    const repo = new SupabasePersistenceRepository({
      url: "https://example.supabase.co",
      serviceRoleKey: "server-secret",
      fetchImpl: async (input, init) => {
        request = new Request(input, init);
        return response(null, 201);
      },
    });
    await repo.saveCandles([{ symbolId: "tsetmc:123", timeframe: "1D", candle: { t: 1, open: 100, high: 110, low: 95, close: 105, volume: 1000 }, providerId: "tsetmc-cdn", receivedAt: 2 }]);
    const body = await request!.json();
    expect(request!.url).toContain("/rest/v1/market_candles?");
    expect((body as Array<Record<string, unknown>>)[0]).toMatchObject({ symbol_id: "tsetmc:123", candle_t: 1, close: 105 });
    expect(request!.headers.get("apikey")).toBe("server-secret");
  });

  it("maps persisted proposal fields back to ARYA shape", async () => {
    const proposal: TradeProposal = { id: "p1", symbol: "TEST", action: "buy", side: "long", confidence: 0.8, entry: 100, stopLoss: 95, takeProfit: 110, thesis: "trend", rationale: ["momentum"], model: "test", createdAt: 1 };
    const repo = new SupabasePersistenceRepository({
      url: "https://example.supabase.co",
      serviceRoleKey: "server-secret",
      fetchImpl: async () => response([{ id: "p1", symbol: "TEST", action: "buy", side: "long", confidence: 0.8, entry: 100, stop_loss: 95, take_profit: 110, thesis: "trend", rationale: ["momentum"], model: "test", created_at: 1, persisted_at: 2 }]),
    });
    await repo.saveProposal(proposalRecord(proposal, 2));
    const rows = await repo.listProposals("TEST");
    expect(rows[0]).toEqual({ ...proposal, persistedAt: 2 });
  });
});
