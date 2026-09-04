# ARYA AI TRADER — Implementation Milestones

## M1 — Core contracts and safety boundary
Status: in progress
- Domain types
- Provider boundaries
- Risk gate
- Paper execution boundary
- AI collaboration protocol

## M2 — Real market data
Status: next
- Provider adapters
- Candle normalization
- Rate limiting/retry
- Data quality checks
- Historical cache

## M3 — Persistence and audit
Status: planned
- Database schema
- Market-data storage
- Analysis snapshots
- Proposals/orders/executions
- Append-only audit log

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
