# ARYA AI TRADER — Implementation Milestones

## M1 — Core contracts and safety boundary
Status: complete
- Domain types
- Provider boundaries
- Risk gate
- Paper execution boundary
- AI collaboration protocol
- Deterministic unit-test entry point

## M2 — Real market data
Status: in progress
- [x] Provider adapter boundary
- [x] Public Binance crypto OHLCV/quote adapter
- [x] Read-only TSETMC Iran-equity adapter
- [x] Candle normalization
- [x] Gap/duplicate/incomplete-series checks
- [x] Provider timeout/retry boundary
- [x] Iran relay provider contract
- [ ] Production Iran collector/relay with Iranian network placement
- [ ] Direct Codal disclosure adapter after current contract verification
- [ ] Historical cache

## M3 — Persistence and audit
Status: in progress
- [x] Database schema
- [x] Market-data storage contract
- [x] Supabase/PostgREST server-side repository adapter
- [x] Analysis snapshots repository path
- [x] Proposals repository path
- [x] Append-only audit-store contract
- [x] Decision-to-audit pipeline boundary
- [ ] Authentication/RLS policies for application read paths
- [ ] Durable database deployment and migration verification
- [ ] Optional Neon/PostgreSQL adapter

## M4 — AI decision service
Status: in progress
- [x] Provider abstraction
- [x] Structured JSON output
- [x] Zod validation
- [x] Model metadata
- [x] Gateway confidence threshold
- [ ] Confidence calibration
- [ ] Prompt/version registry
- [ ] Production model adapter

## M5 — Backtest and paper trading
Status: in progress
- [x] Deterministic fill simulator
- [x] Slippage/fees/spread
- [x] Long/short position accounting
- [x] Replayable next-bar backtest
- [x] Equity and drawdown metrics
- [x] Stop-loss/take-profit event simulation
- [x] Multi-symbol portfolio replay
- [ ] Full fee/tax/market-rule profiles for Iran

## M6 — Portfolio and monitoring
Status: planned
- Positions
- Exposure
- Drawdown
- Alerts
- Health checks
- Kill switch

## M7 — Live adapter
Status: gated
Live execution is not to be implemented as an enabled default. It requires explicit operator approval after M1–M6 tests pass.
