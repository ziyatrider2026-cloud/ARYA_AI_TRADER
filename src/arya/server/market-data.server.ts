import { envelope, unavailable, type DataEnvelope } from "@/arya/core/data-envelope";
import type { Candle, Timeframe } from "@/arya/core/types";
import { persistenceConfigFromEnv } from "@/arya/core/database-config";
import type { PersistenceRepository } from "@/arya/core/persistence";
import { SupabasePersistenceRepository } from "@/arya/core/supabase-persistence";
import type { MarketDataProvider } from "@/arya/providers/base";
import { IranRelayProvider } from "@/arya/providers/iran-relay-provider";
import { TsetmcProvider } from "@/arya/providers/tsetmc-provider";

export interface MarketDataReadRequest {
  symbolId?: string;
  ticker?: string;
  timeframe: Timeframe;
  limit: number;
}

function positiveInt(value: number, fallback: number, max: number): number {
  return Number.isInteger(value) && value > 0 ? Math.min(value, max) : fallback;
}

function createProvider(): MarketDataProvider {
  const relay = process.env.IRAN_RELAY_BASE_URL?.trim();
  if (relay) return new IranRelayProvider({ baseUrl: relay, timeoutMs: 8_000 });
  return new TsetmcProvider({
    baseUrl: process.env.TSETMC_BASE_URL?.trim() || undefined,
    timeoutMs: 8_000,
  });
}

function createPersistence(): PersistenceRepository {
  const config = persistenceConfigFromEnv();
  if (config.provider === "supabase" && config.supabaseUrl && config.supabaseServiceRoleKey) {
    return new SupabasePersistenceRepository({
      url: config.supabaseUrl,
      serviceRoleKey: config.supabaseServiceRoleKey,
      timeoutMs: config.timeoutMs,
    });
  }
  return {
    async saveCandles() {},
    async getCandles() { return []; },
    async saveAnalysis() {},
    async saveProposal() {},
    async listProposals() { return []; },
    async appendAudit() {},
    async listAudit() { return []; },
  };
}

function resolveSymbolId(
  symbols: Array<{ id: string; ticker: string; name: string }>,
  request: MarketDataReadRequest,
): string | undefined {
  if (request.symbolId?.trim()) return request.symbolId.trim();
  const target = request.ticker?.trim() || process.env.ARYA_DEFAULT_IRAN_TICKER?.trim();
  if (!target) return undefined;
  const normalized = target.toLocaleLowerCase("fa-IR");
  const match = symbols.find(
    (symbol) => symbol.ticker.toLocaleLowerCase("fa-IR") === normalized || symbol.name.toLocaleLowerCase("fa-IR").includes(normalized),
  );
  return match?.id;
}

/**
 * Server-only application gateway. Real upstreams are queried first; if they
 * fail, only previously persisted candles may be returned and they are marked
 * STALE. No synthetic/demo fallback is permitted.
 */
export async function readMarketCandles(request: MarketDataReadRequest): Promise<DataEnvelope<Candle[]>> {
  const limit = positiveInt(request.limit, 120, 2_000);
  const provider = createProvider();
  const persistence = createPersistence();

  let symbolId = request.symbolId?.trim();
  if (!symbolId && request.ticker?.trim()) {
    const symbols = await provider.listSymbols("iran-equity");
    symbolId = resolveSymbolId(symbols.data, request);
  }
  if (!symbolId) {
    symbolId = resolveSymbolId([], request);
  }

  if (!symbolId) {
    return unavailable([], "ARYA Market Data Gateway", "market-data-gateway", "No symbolId/ticker configured; set ARYA_DEFAULT_IRAN_TICKER or provide a symbolId");
  }

  const live = await provider.getOhlcv({ symbolId, timeframe: request.timeframe, limit });
  if (live.meta.status === "LIVE" && live.data.length > 0) {
    try {
      await persistence.saveCandles(
        live.data.map((candle) => ({
          symbolId,
          timeframe: request.timeframe,
          candle,
          providerId: live.meta.providerId,
          receivedAt: live.meta.timestamp,
        })),
      );
    } catch (error) {
      return envelope(live.data, {
        source: live.meta.source,
        providerId: live.meta.providerId,
        status: "LIVE",
        quality: Math.min(live.meta.quality, 0.9),
        reason: `Live market data available but persistence failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
    return live;
  }

  try {
    const cached = await persistence.getCandles(symbolId, request.timeframe, limit);
    if (cached.length) {
      const receivedAt = Math.max(...cached.map((record) => record.receivedAt));
      return envelope(
        cached.map((record) => record.candle),
        {
          source: "ARYA Historical Cache",
          providerId: "persistence-cache",
          status: "STALE",
          quality: Math.min(0.5, live.meta.quality),
          timestamp: receivedAt,
          reason: `${live.meta.reason ?? "Live provider unavailable"}; serving persisted data only`,
        },
      );
    }
  } catch {
    // Preserve the original provider failure below; cache errors must not be
    // exposed as if they were market-data errors.
  }

  return unavailable([], live.meta.source, live.meta.providerId, live.meta.reason ?? "No live or cached market data available");
}
