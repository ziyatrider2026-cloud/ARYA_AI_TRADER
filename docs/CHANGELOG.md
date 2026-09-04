# Changelog

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

### Research finding
- Current community-maintained TSETMC endpoint references identify `cdn.tsetmc.com` as a usable public JSON surface and `webgw.tse.ir` as a more complete official-site gateway, with geographic-access caveats. These are upstream integration targets, not guarantees of an SLA.
- For Codal, the architecture now reserves a separate disclosure-provider boundary. A direct production Codal adapter is intentionally deferred until the current public contract and deployment accessibility are verified.

### Handoff
Lovable and Claude: do not bypass `TsetmcProvider`, the data-quality layer, or the paper/backtest execution boundary. For Iran data, prefer a server-side/iran-network collector feeding normalized data into ARYA rather than browser-direct calls.

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

### Not yet enabled
- Verified production TSETMC adapter.
- Historical persistence/cache.
- Production LLM gateway.
- Broker/exchange order submission.

### Handoff
Lovable and Claude should read `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` and this changelog before modifying these contracts.
