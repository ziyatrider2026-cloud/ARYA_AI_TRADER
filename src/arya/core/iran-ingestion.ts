import type { DataEnvelope } from "./data-envelope";
import type { IranCollectRequest, IranCollector, IranSnapshot } from "./iran-market-data";
import type { PersistenceRepository } from "./persistence";

export interface IranIngestionResult {
  snapshot: DataEnvelope<IranSnapshot>;
  persistedCandles: number;
}

/**
 * Server-side ingestion boundary. Collection and persistence stay separate so
 * a database outage never causes the upstream market adapter to fabricate data.
 */
export async function collectAndPersistIranMarket(
  collector: IranCollector,
  repository: PersistenceRepository,
  request?: IranCollectRequest | string,
): Promise<IranIngestionResult> {
  const snapshot = await collector.collect(request);
  const normalizedRequest = typeof request === "string" ? { symbolId: request } : request ?? {};
  if (!normalizedRequest.symbolId || snapshot.data.candles.length === 0) {
    return { snapshot, persistedCandles: 0 };
  }

  await repository.saveCandles(
    snapshot.data.candles.map((candle) => ({
      symbolId: normalizedRequest.symbolId!,
      timeframe: normalizedRequest.timeframe ?? "1D",
      candle,
      providerId: snapshot.meta.providerId,
      receivedAt: snapshot.meta.timestamp,
    })),
  );
  return { snapshot, persistedCandles: snapshot.data.candles.length };
}
