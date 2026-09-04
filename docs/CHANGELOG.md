# Changelog

## 2026-09-04 — Iran collector composition layer

### Added
- Canonical `IranMarketCollector` that composes market-price providers with optional Codal/observer disclosure streams.
- Explicit `IranCollectRequest` and `IranDisclosureProvider` contracts.
- Graceful partial degradation: valid market prices remain `LIVE` when an optional disclosure source is unavailable, with provenance and degradation reason preserved.
- Collector tests for partial disclosure failure and total market-provider failure.

### Safety
- No browser component calls TSETMC, TSE Web Gateway or Codal directly.
- The collector is read-only and has no broker/order capability.
- Unavailable upstreams are never replaced with synthetic prices.

## 2026-09-04 — Durable persistence and multi-symbol portfolio replay

### Added
- Deterministic multi-symbol portfolio backtest with synchronized timestamps and per-symbol closing marks.
- Server-only Supabase/PostgREST persistence adapter implementing the vendor-neutral `PersistenceRepository` contract.
- Supabase migration schema for market candles, analysis snapshots, trade proposals and append-only audit events.
- Adapter tests covering canonical candle writes and proposal field mapping.
- `docs/IMPLEMENTATION_STATUS.md` as a concise handoff for Lovable and Claude.

### Safety
- Supabase service-role credentials are server-only and must never use a `VITE_*` variable.
- Persistence remains behind `PersistenceRepository`; UI code must not depend directly on database vendors.
- Portfolio replay executes orders only when the next timestamp contains a candle for that symbol.
- Live trading remains disabled.

## 2026-09-04 — Iran relay and protective backtest exits

### Added
- `IranMarketSource` catalog separating TSETMC CDN, TSE Web Gateway, Codal, observer messages and macro/reference sources.
- `IranRelayProvider` contract for a read-only server-side relay, suitable for deployment on an Iran-network host.
- Protective stop-loss/take-profit event simulation in the deterministic backtest engine.

### Safety
- The Iran relay has no order-submission capability or broker credentials.
- UI code must not call geo-restricted/unstable Iranian upstreams directly.
- When stop and target are both touched in one OHLC bar, the simulator chooses stop first as a conservative deterministic rule.

### Research finding
- Community-maintained endpoint documentation identifies `cdn.tsetmc.com` as a public JSON surface keyed by `InsCode`, while `webgw.tse.ir` exposes a more complete market-watch/live-instrument surface keyed by ISIN and may require an Iranian network location. These endpoints are treated as integration targets, not SLA-backed guarantees.
- Codal disclosures should remain a separate event stream. Until the current public contract and deployment accessibility are verified, ARYA will not invent a production Codal API.

### Handoff
Lovable and Claude: use the provider/relay contracts rather than direct browser calls; preserve provenance, freshness and `UNAVAILABLE` states. Do not merge this feature branch into `main` without review.

## 2026-09-04 — Paper/backtest and Iran market-data layer

### Added
- Deterministic paper simulator with long/short position accounting.
- Configurable fee, spread and slippage model.
- Replayable backtest engine with next-bar execution to prevent lookahead.
- Equity curve, return, drawdown, fee and closed-fill metrics.
- Read-only TSETMC provider for Iranian equity quotes and daily OHLCV.
- TSETMC provider registration with explicit provenance and graceful degradation.

### Safety
- TSETMC adapter is read-only and never submits orders.
- Undocumented/geo-restricted upstream failures become `UNAVAILABLE`; they are never replaced by demo prices.
- Backtests do not use future candles to create same-bar fills.
- Live trading remains disabled.

## 2026-09-04 — M3 foundation started

### Added
- Append-only audit-store contract with an in-memory implementation.
- Decision pipeline boundary connecting market provenance, proposal evaluation and deterministic risk.
- Automated decision-pipeline audit test.

### Hardened
- Executable proposals now require positive entry and stop-loss values.
- Long/short stop-loss direction is validated.
- Risk sizing is capped by configured maximum leverage.
- Risk decisions deduplicate rejection reasons and report calculated maximum loss.

## 2026-09-04 — M2 Market Data Foundation

### Added
- Binance public crypto market-data adapter for quotes and OHLCV candles.
- Candle normalization from provider-native numeric payloads.
- Duplicate, gap, OHLC relationship, and completeness checks.
- Vitest scripts and initial data-quality tests.
- Core candle/type contracts reconciled with the existing indicator/provider engine.

### Safety
- Binance adapter uses public market-data endpoints only; no trading credentials are required.
- Provider failures return explicit `UNAVAILABLE` envelopes instead of leaking exceptions to the UI.
- Real market data remains provenance-tagged and is never converted into demo data.
- Live order execution remains disabled.
