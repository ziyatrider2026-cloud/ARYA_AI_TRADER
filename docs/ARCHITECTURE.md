# ARYA AI TRADER — Architecture

## Target pipeline
`Market Data -> Normalization -> Validation -> Feature/Indicator Engine -> Smart Money -> Context/News -> AI Proposal -> Risk Gate -> Position Sizing -> Execution -> Portfolio/Monitoring -> Audit`

## Layer ownership
- **Data**: external market sources, historical/live feeds, normalization and quality.
- **Analysis**: deterministic indicators and market-structure features.
- **AI**: explains context and produces a typed `TradeProposal`; it cannot place orders.
- **Risk**: deterministic safety policy. It can reject an AI proposal.
- **Execution**: broker/exchange adapter selected by mode: backtest, paper, live.
- **Portfolio**: positions, balances, exposure and P&L.
- **Audit**: append-only decision and execution events.
- **Persistence**: repository interfaces store market candles, analysis snapshots, proposals and audit events without coupling domain logic to a database vendor.

## Safety boundary
The only path to an order is:
`TradeProposal -> RiskDecision(approved) -> OrderIntent -> ExecutionAdapter`.
There is no direct `AI -> broker` path.

## AI gateway boundary
AI providers return untrusted structured output. The gateway validates it with Zod before exposing a `TradeProposal` to the rest of the system. Invalid provider output becomes an explicit `UNAVAILABLE` envelope. Model name and prompt version are part of the request metadata. A gateway confidence threshold may downgrade quality but never bypasses deterministic risk controls.

## Runtime modes
- `backtest`: historical simulation only.
- `paper`: simulated execution using live or historical data.
- `live`: disabled by default and requires explicit configuration plus operational approval.

## Iran market-data architecture
Iranian market connectivity is split into source-specific adapters and a deployable relay boundary. TSETMC CDN is useful for public symbol/history data, while the TSE web gateway is the preferred surface for market-watch/order-book data when network access permits. Codal and observer messages remain separate disclosure/event streams. Public reverse-engineered endpoints are treated as unstable integrations and are monitored with health checks, timeouts, retries and schema validation.

Recommended production topology:
`TSETMC/Codal/TSE Gateway -> Iran Relay Collector -> Normalization/Validation -> Durable Store -> ARYA API -> UI/AI`

The Iran relay is read-only. It contains no broker credentials and has no order-submission capability. Keeping the relay in an Iranian network location also avoids making the browser responsible for cross-origin, geo-restricted or unstable upstream access.

## Migration strategy
Existing `src/arya` indicator/provider/smart-money code remains the source of truth for current deterministic analytics. New domain contracts live under `src/arya/core` and are intentionally adapter-oriented so the UI can migrate incrementally without a rewrite.

## Data integrity
Every market snapshot should identify provider, received time, source time when available, symbol, timeframe and quality. Missing or stale data must produce an explicit error/quality state, never fabricated values.

## Persistence strategy
Domain code depends on repository interfaces, not a specific database. The in-memory repository is the deterministic test/local implementation. A durable adapter will be introduced only after the deployment/runtime database choice is confirmed; it must preserve append-only audit semantics and idempotent candle storage.
