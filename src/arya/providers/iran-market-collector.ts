import { envelope, unavailable, type DataEnvelope } from "@/arya/core/data-envelope";
import type { IranCollectRequest, IranCollector, IranCollectorConfig, IranDisclosureProvider, IranSnapshot } from "@/arya/core/iran-market-data";
import type { MarketDataProvider } from "./base";
import { safeProviderCall, type SafeCallOptions } from "./registry";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 2_000;

function requestOf(request?: IranCollectRequest | string): Required<Pick<IranCollectRequest, "timeframe" | "limit">> & Pick<IranCollectRequest, "symbolId"> {
  const normalized = typeof request === "string" ? { symbolId: request } : request ?? {};
  return {
    symbolId: normalized.symbolId,
    timeframe: normalized.timeframe ?? "1D",
    limit: Math.min(MAX_LIMIT, Math.max(1, Math.trunc(normalized.limit ?? DEFAULT_LIMIT))),
  };
}

/**
 * Composes canonical price data with optional disclosure streams.
 * A missing disclosure stream must not turn valid market prices into
 * UNAVAILABLE; its degradation is represented by lower quality/reason text.
 */
export class IranMarketCollector implements IranCollector {
  private readonly market: MarketDataProvider;
  private readonly disclosures: IranDisclosureProvider[];
  private readonly safeOptions: SafeCallOptions;

  constructor(options: {
    marketProvider: MarketDataProvider;
    disclosureProviders?: IranDisclosureProvider[];
    config: IranCollectorConfig;
  }) {
    this.market = options.marketProvider;
    this.disclosures = options.disclosureProviders ?? [];
    this.safeOptions = {
      timeoutMs: options.config.requestTimeoutMs,
      retries: options.config.maxRetries,
      backoffMs: Math.min(2_000, Math.max(50, Math.round(options.config.pollIntervalMs / 10))),
    };
  }

  async collect(request?: IranCollectRequest | string): Promise<DataEnvelope<IranSnapshot>> {
    const input = requestOf(request);
    const symbolResult = await safeProviderCall(
      "Iran symbol catalog",
      this.market.info.id,
      [],
      () => this.market.listSymbols("iran-equity"),
      this.safeOptions,
    );

    const candleResult = input.symbolId
      ? await safeProviderCall(
          "Iran OHLCV",
          this.market.info.id,
          [],
          () => this.market.getOhlcv({ symbolId: input.symbolId!, timeframe: input.timeframe, limit: input.limit }),
          this.safeOptions,
        )
      : envelope([], {
          source: this.market.info.name,
          providerId: this.market.info.id,
          status: "LIVE",
          quality: 1,
          reason: "No symbol requested; catalog-only collection",
        });

    const disclosureResults = await Promise.all(
      this.disclosures.map((provider) =>
        safeProviderCall(
          `${provider.sourceId} disclosures`,
          provider.sourceId,
          [],
          () => provider.listDisclosures(input.symbolId, Math.min(input.limit, 500)),
          this.safeOptions,
        ),
      ),
    );

    const disclosureData = disclosureResults.flatMap((result) => result.data);
    const degradedReasons = [
      symbolResult.meta.reason,
      candleResult.meta.reason,
      ...disclosureResults.map((result) => result.meta.reason),
    ].filter(Boolean) as string[];

    const marketUnavailable = symbolResult.meta.status === "UNAVAILABLE" && candleResult.meta.status === "UNAVAILABLE";
    if (marketUnavailable) {
      return unavailable(
        { symbols: [], candles: [], disclosures: disclosureData },
        "ARYA Iran Market Collector",
        "iran-market-collector",
        degradedReasons.join("; ") || "Iran market providers unavailable",
      );
    }

    const qualityParts = [symbolResult.meta.quality, candleResult.meta.quality];
    if (this.disclosures.length > 0) qualityParts.push(...disclosureResults.map((result) => result.meta.quality));
    const quality = Math.min(...qualityParts);
    return envelope(
      {
        symbols: symbolResult.data,
        candles: candleResult.data,
        disclosures: disclosureData,
      },
      {
        source: "ARYA Iran Market Collector",
        providerId: "iran-market-collector",
        status: "LIVE",
        quality,
        reason: degradedReasons.length ? degradedReasons.join("; ") : undefined,
      },
    );
  }
}
