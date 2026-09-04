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
- [x] Candle normalization
- [x] Gap/duplicate/incomplete-series checks
- [x] Provider timeout/retry boundary
- [ ] TSETMC production adapter after endpoint contract verification
- [ ] Historical cache

## M3 — Persistence and audit
Status: in progress
- [ ] Database schema
- [ ] Market-data storage
- [ ] Analysis snapshots
- [ ] Proposals/orders/executions
- [x] Append-only audit-store contract
- [x] Decision-to-audit pipeline boundary
- [ ] Durable database implementation

## M4 — AI decision service
Status: planned
- Provider abstraction
- Structured JSON output
- Zod validation
- Model metadata
- Confidence calibration
- Prompt/version registry

## M5 — Backtest and paper trading
Status: planned
- Fill simulator
- Slippage/fees/spread
- Position accounting
- Metrics
- Replayable scenarios

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
