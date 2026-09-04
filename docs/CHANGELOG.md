# Changelog

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
